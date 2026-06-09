const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user.model');
const Badge = require('../models/badge.model');
const Mission = require('../models/mission.model');
const Notification = require('../models/notification.model');
const { awardBadge } = require('../utils/badges');

describe('Achievement Badges System', () => {
    let testUser;
    let userToken;

    beforeAll(async () => {
        jest.setTimeout(25000);
        if (mongoose.connection.readyState !== 1) {
            if (mongoose.connection.readyState === 2) {
                await new Promise((resolve) => mongoose.connection.once('connected', resolve));
            } else {
                await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/topiq_test');
            }
        }
    }, 25000);

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({ email: /test_badge/ });
        await Badge.deleteMany({});
        await Notification.deleteMany({});
        await Mission.deleteMany({});

        // Create a test user
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Badge User',
                email: 'test_badge@test.com',
                password: 'password123',
                targetGoal: 'good'
            });

        testUser = response.body.data.user;
        if (testUser && testUser.id) {
            testUser._id = testUser.id;
        }
        userToken = response.body.data.token;
    });

    // Test 1: awardBadge creates a Badge document and a Notification
    it('should award a badge and create a notification when awardBadge is called', async () => {
        const res = await awardBadge(testUser._id, 'first_blood');
        expect(res.awarded).toBe(true);
        expect(res.badge).toBeDefined();
        expect(res.badge.badgeId).toBe('first_blood');

        // Check DB
        const badgeDoc = await Badge.findOne({ userId: testUser._id, badgeId: 'first_blood' });
        expect(badgeDoc).not.toBeNull();

        const notifDoc = await Notification.findOne({ userId: testUser._id, type: 'achievement' });
        expect(notifDoc).not.toBeNull();
        expect(notifDoc.title).toContain('First Blood');
    });

    // Test 2: awardBadge returns { awarded: false } if badge already exists (idempotent)
    it('should be idempotent and not create duplicate badges or notifications', async () => {
        // First award
        const res1 = await awardBadge(testUser._id, 'first_blood');
        expect(res1.awarded).toBe(true);

        // Second award
        const res2 = await awardBadge(testUser._id, 'first_blood');
        expect(res2.awarded).toBe(false);

        // Check DB counts
        const badgeCount = await Badge.countDocuments({ userId: testUser._id, badgeId: 'first_blood' });
        expect(badgeCount).toBe(1);

        const notifCount = await Notification.countDocuments({ userId: testUser._id, type: 'achievement' });
        expect(notifCount).toBe(1);
    });

    // Test 3: GET /api/badges returns correct earned/total count
    it('should fetch the list of badges and return correct earned/total count', async () => {
        // Award two badges
        await awardBadge(testUser._id, 'first_blood');
        await awardBadge(testUser._id, 'crisis_survivor');

        const res = await request(app)
            .get('/api/badges')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.earned.length).toBe(2);
        expect(res.body.data.total).toBe(7); // We have 7 badges in definition
        expect(res.body.data.earned[0].name).toBeDefined();
        expect(res.body.data.earned[0].emoji).toBeDefined();
    });

    // Test 4: first_blood badge is awarded after first mission completion
    it('should trigger first_blood award after completing the first mission', async () => {
        // Create subject
        const subRes = await request(app)
            .post('/api/subjects')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Math',
                code: 'MTH101',
                difficulty: 'medium',
                color: '#ef4444'
            });
        
        const subjectId = subRes.body.data._id;

        // Create a mission
        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Study Integration',
            type: 'study',
            priority: 'medium',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        // Complete the mission
        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed' });

        expect(res.status).toBe(200);

        // Check if first_blood badge was awarded
        const badgeDoc = await Badge.findOne({ userId: testUser._id, badgeId: 'first_blood' });
        expect(badgeDoc).not.toBeNull();
    });

    // Test 5: no_days_off badge is awarded when streak hits exactly 14
    it('should trigger no_days_off award when user streak reaches 14', async () => {
        const userInDb = await User.findById(testUser._id);
        userInDb.streak = 13;
        userInDb.lastActiveDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        await userInDb.save();

        // Run streakSync by hitting dashboard
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);

        // Check if user streak is now 14
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.streak).toBe(14);

        // Check if no_days_off badge was awarded
        const badgeDoc = await Badge.findOne({ userId: testUser._id, badgeId: 'no_days_off' });
        expect(badgeDoc).not.toBeNull();
    });
});
