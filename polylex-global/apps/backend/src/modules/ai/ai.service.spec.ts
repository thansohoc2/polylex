import { ServiceUnavailableException } from '@nestjs/common';
import { AiService } from './ai.service';

describe('AiService.generateWordAnalysis', () => {
  it('returns valid analysis when Gemini JSON is well-formed', async () => {
    const config = { get: jest.fn((key: string) => (key === 'GEMINI_ENABLED' ? true : undefined)) } as any;
    const service = new AiService(config);

    (service as any).geminiJson = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            term: 'take off',
            languageCode: 'en',
            nuance: {
              title: 'Nuance and meaning',
              summary: 'To leave the ground or to start something.',
              examples: ['The plane took off on time.', 'We took off our jackets.'],
            },
            verbForms: null,
            tenseUsage: {
              title: 'Tense usage',
              summary: 'Common in past and present perfect.',
              examples: ['The plane takes off at 7.', 'The plane took off at 7.'],
            },
            prepositions: null,
            phrasalVerbs: {
              title: 'Phrasal verbs',
              summary: 'Strongly linked to separation and departure.',
              examples: ['The plane took off quickly.', 'We took off for lunch.'],
            },
            collocations: {
              title: 'Collocations',
              summary: 'Used with time, speed, and travel contexts.',
              examples: ['take off quickly', 'take off in the morning'],
            },
          }),
        },
      }),
    };

    const result = await service.generateWordAnalysis('take off', 'en', 'vi', 'B1', 'phrasal verb');

    expect(result.term).toBe('take off');
    expect(result.nuance.examples).toHaveLength(2);
    expect(result.collocations?.title).toBe('Collocations');
  });

  it('accepts nullable summary and empty or null example arrays from Gemini for optional sections', async () => {
    const config = { get: jest.fn((key: string) => (key === 'GEMINI_ENABLED' ? true : undefined)) } as any;
    const service = new AiService(config);

    (service as any).geminiJson = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            term: 'take off',
            languageCode: 'en',
            nuance: {
              title: 'Nuance and meaning',
              summary: 'To leave the ground or to begin something.',
              examples: ['The plane took off on time.'],
            },
            verbForms: null,
            tenseUsage: {
              title: 'Tense usage',
              summary: 'Often used in the past and present perfect.',
              examples: ['He took off his jacket.', 'They take off early.'],
            },
            prepositions: null,
            phrasalVerbs: {
              title: 'Phrasal verbs',
              summary: null,
              examples: null,
            },
            collocations: {
              title: 'Collocations',
              summary: 'Common with flight and travel language.',
              examples: ['take off quickly', 'take off in the morning'],
            },
          }),
        },
      }),
    };

    const result = await service.generateWordAnalysis('take off', 'en', 'vi', 'B1', 'phrasal verb');

    expect(result.phrasalVerbs).toEqual({
      title: 'Phrasal verbs',
      summary: null,
      examples: [],
    });
  });

  it('throws a ServiceUnavailableException when the AI response is malformed JSON', async () => {
    const config = { get: jest.fn((key: string) => (key === 'GEMINI_ENABLED' ? true : undefined)) } as any;
    const service = new AiService(config);

    (service as any).geminiJson = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'not-json',
        },
      }),
    };

    await expect(service.generateWordAnalysis('hello', 'en', 'vi', 'A2', 'noun')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
