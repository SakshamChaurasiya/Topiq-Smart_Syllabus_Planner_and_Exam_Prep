const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Imports the app instance exported from index.js
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

describe('Streak Freeze Token Feature', () => {
    let testUser;
    let userToken;

    beforeAll(async () => {
        jest.setTimeout(25000);
        // Ensure mongoose is connected
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
        await User.deleteMany({ email: /test_streak_freeze/ });
        await Notification.deleteMany({});

        // Create a test user
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Streak Test User',
                email: 'test_streak_freeze@test.com',
                password: 'password123',
                targetGoal: 'good'
            });

        testUser = response.body.data.user;
        if (testUser && testUser.id) {
            testUser._id = testUser.id;
        }
        userToken = response.body.data.token;
    });

    // Test 1: streak resets to 0 when no freeze tokens and user missed a day
    it('should reset streak to 0 when no freeze tokens are available and the user missed yesterday', async () => {
        // Prepare user state in DB
        const userInDb = await User.findById(testUser._id);
        userInDb.streak = 5;
        // Set lastActiveDate to 2 days ago (missed yesterday)
        userInDb.lastActiveDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        userInDb.streakFreezeTokens = 0;
        await userInDb.save();

        // Trigger request that runs streakSync middleware
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);

        // Check updated user state
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.streak).toBe(0);
        expect(updatedUser.streakFreezeTokens).toBe(0);
    });

    // Test 2: streak is preserved and token decremented when freeze token exists and user missed a day
    it('should preserve streak and decrement freeze tokens when a token exists and the user missed yesterday', async () => {
        // Prepare user state in DB
        const userInDb = await User.findById(testUser._id);
        userInDb.streak = 5;
        // Set lastActiveDate to 2 days ago (missed yesterday)
        userInDb.lastActiveDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        userInDb.streakFreezeTokens = 2;
        await userInDb.save();

        // Trigger request that runs streakSync middleware
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);

        // Check updated user state
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.streak).toBe(5); // Streak preserved
        expect(updatedUser.streakFreezeTokens).toBe(1); // Decrement token count
        expect(updatedUser.streakFreezeUsedAt).not.toBeNull();
    });

    // Test 3: POST /api/streak-freeze/award increments token count
    it('should increment streak freeze token count via POST /api/streak-freeze/award', async () => {
        const initialUser = await User.findById(testUser._id);
        expect(initialUser.streakFreezeTokens).toBe(3);

        const res = await request(app)
            .post('/api/streak-freeze/award')
            .set('Authorization', `Bearer ${userToken}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.streakFreezeTokens).toBe(4);

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.streakFreezeTokens).toBe(4);
    });

    // Test 4: token is awarded automatically after a 7-day streak milestone
    it('should automatically award a token and send a notification when a 7-day streak milestone is hit', async () => {
        // Set user streak to 7 and ensure it will not reset
        const userInDb = await User.findById(testUser._id);
        userInDb.streak = 7;
        userInDb.lastActiveDate = new Date(); // Active today
        userInDb.streakFreezeTokens = 0;
        await userInDb.save();

        // Create a subject and a mission to complete
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

        // Create mission
        const Mission = require('../models/mission.model');
        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Study Calculus',
            type: 'study',
            priority: 'high',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        // Complete the mission to award XP and check milestone
        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed' });

        expect(res.status).toBe(200);

        // User should have received the token in DB
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.streakFreezeTokens).toBe(1);

        // A streak-alert notification should be created
        const notifications = await Notification.find({ userId: testUser._id, type: 'streak-alert' });
        expect(notifications.length).toBe(1);
        expect(notifications[0].message).toContain('Streak Freeze token earned!');
    });

    // Test 5: token is awarded automatically on reaching a level multiple of 5
    it('should award a token and send a notification when the user levels up to a multiple of 5', async () => {
        const userInDb = await User.findById(testUser._id);
        userInDb.level = 4;
        userInDb.xp = 410;
        userInDb.streak = 1;
        userInDb.streakFreezeTokens = 0;
        await userInDb.save();

        // Create a subject and a mission to complete
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

        // Create mission
        const Mission = require('../models/mission.model');
        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Study Calculus',
            type: 'study',
            priority: 'high',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        // Complete the mission to trigger level up to 5
        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed' });

        expect(res.status).toBe(200);

        // User level should be 5 and should have received a token
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.level).toBe(5);
        expect(updatedUser.streakFreezeTokens).toBe(1);

        // A level-up milestone notification should be created
        const notifications = await Notification.find({ userId: testUser._id, type: 'streak-alert' });
        expect(notifications.some(n => n.message.includes('Reaching Level 5'))).toBe(true);
    });

    // Test 6: tokens are awarded on significant streak milestones (30-day and 100-day)
    it('should award extra tokens on reaching 30-day and 100-day streak milestones', async () => {
        // Set user streak to 30
        const userInDb = await User.findById(testUser._id);
        userInDb.streak = 30;
        userInDb.lastActiveDate = new Date();
        userInDb.streakFreezeTokens = 0;
        await userInDb.save();

        // Create a subject and a mission to complete
        const subRes = await request(app)
            .post('/api/subjects')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Science',
                code: 'SCI101',
                difficulty: 'easy',
                color: '#3b82f6'
            });
        
        const subjectId = subRes.body.data._id;

        // Create mission
        const Mission = require('../models/mission.model');
        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Study Physics',
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

        // User should have received the token for 30-day streak
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.streakFreezeTokens).toBe(1);

        // A streak-alert notification for 30-day milestone should be created
        const notifications = await Notification.find({ userId: testUser._id, type: 'streak-alert' });
        expect(notifications.some(n => n.message.includes('30-day streak'))).toBe(true);
    });
});
