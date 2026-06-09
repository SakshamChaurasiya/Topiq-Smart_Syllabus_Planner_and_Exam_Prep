const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/user.model');
const Syllabus = require('../models/syllabus.model');

jest.setTimeout(30000);

describe('Syllabus Topic Completion Confidence Feature', () => {
    let testUser;
    let userToken;
    let subjectId;
    let syllabus;
    let topicId;

    beforeAll(async () => {
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
        const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const email = `test_syllabus_conf_${uniqueSuffix}@test.com`;

        await User.deleteMany({ email: /test_syllabus_conf/ });
        await Syllabus.deleteMany({});

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Syllabus Conf User',
                email: email,
                password: 'password123',
                targetGoal: 'good'
            });

        testUser = response.body.data?.user;
        if (testUser && testUser.id) {
            testUser._id = testUser.id;
        }
        userToken = response.body.data?.token;

        // Create a subject
        const subRes = await request(app)
            .post('/api/subjects')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Syllabus Conf Subject',
                code: 'SYLL101',
                difficulty: 'medium',
                color: '#6366f1'
            });
        
        subjectId = subRes.body.data?._id;

        // Create a syllabus containing a topic
        syllabus = await Syllabus.create({
            userId: testUser._id,
            subjectId: subjectId,
            inputType: 'text',
            rawContent: 'Software engineering core content',
            isAnalyzed: true,
            units: [{
                unitNumber: 1,
                unitName: 'Requirements Engineering',
                topics: [{
                    name: 'Functional Requirements',
                    importance: 'medium',
                    difficulty: 'medium',
                    estimatedHours: 2,
                    isCompleted: false,
                    marksWeightage: 5,
                    summary: 'Intro to functional specs'
                }]
            }]
        });

        topicId = syllabus.units[0].topics[0]._id;
    });

    // Test 1: Complete with shaky confidence
    it('should complete syllabus topic with shaky confidence, updating priority and setting shaky SR rating', async () => {
        const res = await request(app)
            .put(`/api/syllabus/${syllabus._id}/topic/${topicId}/complete`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ isCompleted: true, confidence: 'shaky' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const updatedSyllabus = await Syllabus.findById(syllabus._id);
        const topic = updatedSyllabus.units[0].topics[0];
        expect(topic.isCompleted).toBe(true);
        expect(topic.importance).toBe('critical');

        const progressEntry = updatedSyllabus.topicProgress.find(
            tp => tp.topicName.toLowerCase().trim() === topic.name.toLowerCase().trim()
        );
        expect(progressEntry).toBeDefined();
        expect(progressEntry.rating).toBe('shaky');
    });

    // Test 2: Complete with solid confidence
    it('should complete syllabus topic with solid confidence, updating priority and setting got-it SR rating', async () => {
        const res = await request(app)
            .put(`/api/syllabus/${syllabus._id}/topic/${topicId}/complete`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ isCompleted: true, confidence: 'solid' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const updatedSyllabus = await Syllabus.findById(syllabus._id);
        const topic = updatedSyllabus.units[0].topics[0];
        expect(topic.isCompleted).toBe(true);
        expect(topic.importance).toBe('low');

        const progressEntry = updatedSyllabus.topicProgress.find(
            tp => tp.topicName.toLowerCase().trim() === topic.name.toLowerCase().trim()
        );
        expect(progressEntry).toBeDefined();
        expect(progressEntry.rating).toBe('got-it');
    });

    // Test 3: Reject invalid confidence rating
    it('should reject invalid confidence values with a 400 status code', async () => {
        const res = await request(app)
            .put(`/api/syllabus/${syllabus._id}/topic/${topicId}/complete`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ isCompleted: true, confidence: 'perfect' });

        expect(res.status).toBe(400);
    });

    // Test 4: Complete without confidence (backward compatibility)
    it('should support completing topic without confidence rating', async () => {
        const res = await request(app)
            .put(`/api/syllabus/${syllabus._id}/topic/${topicId}/complete`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ isCompleted: true });

        expect(res.status).toBe(200);
        
        const updatedSyllabus = await Syllabus.findById(syllabus._id);
        const topic = updatedSyllabus.units[0].topics[0];
        expect(topic.isCompleted).toBe(true);
        expect(topic.importance).toBe('medium'); // remains unchanged

        const progressEntry = updatedSyllabus.topicProgress.find(
            tp => tp.topicName.toLowerCase().trim() === topic.name.toLowerCase().trim()
        );
        expect(progressEntry).toBeDefined();
        expect(progressEntry.rating).toBe('got-it');
    });
});
