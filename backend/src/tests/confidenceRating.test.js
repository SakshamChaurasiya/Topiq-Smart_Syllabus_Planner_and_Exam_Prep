const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user.model');
const Mission = require('../models/mission.model');
const Syllabus = require('../models/syllabus.model');

describe('Confidence Rating Feature', () => {
    let testUser;
    let userToken;
    let subjectId;

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
        await User.deleteMany({ email: /test_confidence/ });
        await Mission.deleteMany({});
        await Syllabus.deleteMany({});

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Confidence User',
                email: 'test_confidence@test.com',
                password: 'password123',
                targetGoal: 'good'
            });

        testUser = response.body.data.user;
        if (testUser && testUser.id) {
            testUser._id = testUser.id;
        }
        userToken = response.body.data.token;

        // Create a subject
        const subRes = await request(app)
            .post('/api/subjects')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Confidence Subject',
                code: 'CONF101',
                difficulty: 'medium',
                color: '#ef4444'
            });
        
        subjectId = subRes.body.data._id;
    });

    // Test 1: completing mission without confidence still works (backward compat)
    it('should complete mission without confidence (backward compat)', async () => {
        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Learn Confidence',
            type: 'study',
            priority: 'medium',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const updatedMission = await Mission.findById(mission._id);
        expect(updatedMission.status).toBe('completed');
        expect(updatedMission.confidence).toBeNull();
    });

    // Test 2: completing with confidence='shaky' saves field and adds bonus XP
    it('should save shaky confidence and add 15 bonus XP', async () => {
        const initialUser = await User.findById(testUser._id);
        const initialXP = initialUser.xp;

        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Learn Confidence',
            type: 'study',
            priority: 'medium',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed', confidence: 'shaky' });

        expect(res.status).toBe(200);
        expect(res.body.data.xpEarned).toBe(35); // 20 reward + 15 bonus

        const updatedMission = await Mission.findById(mission._id);
        expect(updatedMission.status).toBe('completed');
        expect(updatedMission.confidence).toBe('shaky');

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.xp).toBe(initialXP + 35);
    });

    // Test 3: completing with confidence='solid' saves field correctly and adds 5 bonus XP
    it('should save solid confidence and add 5 bonus XP', async () => {
        const initialUser = await User.findById(testUser._id);
        const initialXP = initialUser.xp;

        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Learn Confidence',
            type: 'study',
            priority: 'medium',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed', confidence: 'solid' });

        expect(res.status).toBe(200);
        expect(res.body.data.xpEarned).toBe(25); // 20 reward + 5 bonus

        const updatedMission = await Mission.findById(mission._id);
        expect(updatedMission.status).toBe('completed');
        expect(updatedMission.confidence).toBe('solid');

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.xp).toBe(initialXP + 25);
    });

    // Test 4: invalid confidence value is rejected with 400
    it('should reject invalid confidence value with 400', async () => {
        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Learn Confidence',
            type: 'study',
            priority: 'medium',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed', confidence: 'perfect' });

        expect(res.status).toBe(400);
    });

    // Test 5: shaky confidence updates topic priority to 'critical' in Syllabus
    it('should update topic importance to critical in Syllabus for shaky confidence', async () => {
        // Create a syllabus containing the topic
        const syllabus = await Syllabus.create({
            userId: testUser._id,
            subjectId: subjectId,
            inputType: 'text',
            rawContent: 'Calculus course content',
            isAnalyzed: true,
            units: [{
                unitNumber: 1,
                unitName: 'Calculus Basics',
                topics: [{
                    name: 'Calculus Limits',
                    importance: 'medium',
                    difficulty: 'medium',
                    estimatedHours: 2,
                    isCompleted: false,
                    marksWeightage: 10,
                    summary: 'Limits summary'
                }]
            }]
        });

        const mission = await Mission.create({
            userId: testUser._id,
            subjectId: subjectId,
            studyPlanId: new mongoose.Types.ObjectId(),
            title: 'Study Limits',
            topicName: 'Calculus Limits',
            type: 'study',
            priority: 'medium',
            status: 'pending',
            dueDate: new Date(),
            xpReward: 20
        });

        const res = await request(app)
            .put(`/api/missions/${mission._id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ status: 'completed', confidence: 'shaky' });

        expect(res.status).toBe(200);

        const updatedSyllabus = await Syllabus.findOne({ subjectId });
        const topic = updatedSyllabus.units[0].topics[0];
        expect(topic.importance).toBe('critical');
    });
});
