import { describe, it, expect } from 'vitest';
import { answerPolicy } from './answer-policy';
import { renameProjectSchema, renameConversationSchema } from './rename-record';
describe('règles personnelles des réponses', () => {
  it('ne présente pas MAVAI spontanément', () => expect(answerPolicy().introduceSelf).toBe(false));
  it('ne liste pas les expertises sans demande', () => expect(answerPolicy().displayExpertise).toBe(false));
  it('respecte une demande explicite d’expertises', () => expect(answerPolicy(true).displayExpertise).toBe(true));
  it('conserve le regard critique', () => expect(answerPolicy().criticalExpertise).toBe(true));
  it('conserve les précisions oubliées', () => expect(answerPolicy().identifyOmissions).toBe(true));
  it('conserve les questions et réponses utiles', () => expect(answerPolicy().answerNecessaryQuestions).toBe(true));
  it('conserve les questions sans réponse', () => expect(answerPolicy().identifyOpenQuestions).toBe(true));
});
describe('renommage sans nom vide', () => {
  const id = '0abe8fa9-aec9-41be-946d-893413b2f2ad';
  for (const [kind, schema] of [['projet', renameProjectSchema], ['chat', renameConversationSchema]] as const) {
    it(`${kind} refuse un nom vide`, () => expect(schema.safeParse({ id, title: '  ' }).success).toBe(false));
    it(`${kind} conserve le nom fourni`, () => expect(schema.parse({ id, title: '  Film client  ' })).toEqual({ id, title: 'Film client' }));
  }
});