import { describe,it,expect } from 'vitest';
import { projectMatches,projectSearch } from '../lib/project-scope';
describe('Project isolation',()=>{
 it('returns only resources for the selected project',()=>{
  expect(projectMatches('project-a','project-a')).toBe(true);
  expect(projectMatches('project-b','project-a')).toBe(false);
  expect(projectMatches(null,'project-a')).toBe(false);
 });
 it('keeps old unassigned resources separate',()=>{
  expect(projectMatches(null,undefined)).toBe(true);
  expect(projectMatches('project-a',undefined)).toBe(false);
 });
 it('rejects invalid project identifiers',()=>{
  expect(projectSearch.safeParse({project:'not-a-project'}).success).toBe(false);
  expect(projectSearch.safeParse({project:'f33bbbed-d143-48e4-ac62-47577fb4855d'}).success).toBe(true);
 });
});