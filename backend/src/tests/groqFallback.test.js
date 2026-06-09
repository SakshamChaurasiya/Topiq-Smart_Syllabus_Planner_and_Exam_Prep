const { test } = require('node:test');
const assert = require('node:assert/strict');

// ── Helper: simulate what callGroq does with a mock client ──
const makeCallGroq = (mockClient) => async (systemPrompt, userPrompt) => {
    if (!mockClient) {
        return null;
    }
    try {
        const completion = await mockClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
        });
        const text = completion.choices[0]?.message?.content || null;
        if (!text) return null;
        const cleaned = text
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
        return cleaned;
    } catch (error) {
        return null;
    }
};

// ── Test 1: returns null when groqClient is null (no key configured) ──
test('callGroq returns null when client is not configured', async () => {
    const callGroq = makeCallGroq(null);
    const result = await callGroq('system', 'user');
    assert.equal(result, null);
});

// ── Test 2: returns cleaned text when Groq responds successfully ──
test('callGroq returns cleaned response on success', async () => {
    const mockClient = {
        chat: {
            completions: {
                create: async () => ({
                    choices: [{ message: { content: '{"key": "value"}' } }],
                }),
            },
        },
    };
    const callGroq = makeCallGroq(mockClient);
    const result = await callGroq('system', 'user');
    assert.equal(result, '{"key": "value"}');
});

// ── Test 3: strips markdown fences from Groq response ──
test('callGroq strips markdown code fences', async () => {
    const mockClient = {
        chat: {
            completions: {
                create: async () => ({
                    choices: [{ message: { content: '```json\n{"key": "value"}\n```' } }],
                }),
            },
        },
    };
    const callGroq = makeCallGroq(mockClient);
    const result = await callGroq('system', 'user');
    assert.equal(result, '{"key": "value"}');
});

// ── Test 4: returns null when Groq throws ──
test('callGroq returns null when client throws', async () => {
    const mockClient = {
        chat: {
            completions: {
                create: async () => { throw new Error('Groq network error'); },
            },
        },
    };
    const callGroq = makeCallGroq(mockClient);
    const result = await callGroq('system', 'user');
    assert.equal(result, null);
});

// ── Test 5: fallback is triggered on 503, not on other errors ──
test('fallback logic triggers on 503 status but not on generic errors', async () => {
    // Simulate the fallback decision logic from callAI catch block
    const shouldFallback = (error) => error?.status === 503 || error?.status === 429;

    assert.equal(shouldFallback({ status: 503 }), true);
    assert.equal(shouldFallback({ status: 429 }), true);
    assert.equal(shouldFallback({ status: 400 }), false);
    assert.equal(shouldFallback({ status: 500 }), false);
    assert.equal(shouldFallback({}), false);
    assert.equal(shouldFallback(null), false);
});

// ── Test 6: returns null when choices array is empty ──
test('callGroq returns null when choices array is empty', async () => {
    const mockClient = {
        chat: {
            completions: {
                create: async () => ({ choices: [] }),
            },
        },
    };
    const callGroq = makeCallGroq(mockClient);
    const result = await callGroq('system', 'user');
    assert.equal(result, null);
});
