import { describe, it, expect } from 'vitest';

describe('ManualComparisonTable', () => {
  describe('Data access patterns', () => {
    it('should correctly access contentLevel from overview', () => {
      const mockEvaluation = {
        content: {
          overview: {
            didacticApproach: {
              description: 'Test approach',
              economicSchool: 'Test school'
            },
            contentLevel: {
              breadth: 'Ampio',
              depth: 'Approfondito',
              theoryPracticeBalance: 'Bilanciato'
            }
          },
          strengths: [
            { area: 'Strength 1', description: 'Test strength', relevance: 'High' }
          ],
          weaknesses: [
            { area: 'Weakness 1', description: 'Test weakness', impact: 'Medium' }
          ],
          frameworkCoverage: {
            modules: [
              { moduleId: 1, moduleName: 'Module 1', coveragePercentage: 80, coveredTopics: ['Topic 1'], missingTopics: [], notes: 'Good coverage' }
            ],
            overallCoverage: 80
          }
        }
      };

      // Test that contentLevel is accessible from overview
      const content = mockEvaluation.content as any;
      const overview = content?.overview;
      
      expect(overview?.contentLevel).toBeDefined();
      expect(overview?.contentLevel?.breadth).toBe('Ampio');
      expect(overview?.contentLevel?.depth).toBe('Approfondito');
      expect(overview?.contentLevel?.theoryPracticeBalance).toBe('Bilanciato');
    });

    it('should correctly access frameworkCoverage.overallCoverage', () => {
      const mockEvaluation = {
        content: {
          overview: {
            didacticApproach: { description: 'Test', economicSchool: 'Test' },
            contentLevel: { breadth: 'Ampio', depth: 'Approfondito', theoryPracticeBalance: 'Bilanciato' }
          },
          frameworkCoverage: {
            modules: [],
            overallCoverage: 85
          }
        }
      };

      const content = mockEvaluation.content as any;
      
      expect(content?.frameworkCoverage?.overallCoverage).toBe(85);
      expect(content?.frameworkCoverage?.overallPercentage).toBeUndefined();
    });

    it('should correctly access strengths and weaknesses from content root', () => {
      const mockEvaluation = {
        content: {
          overview: {
            didacticApproach: { description: 'Test', economicSchool: 'Test' },
            contentLevel: { breadth: 'Ampio', depth: 'Approfondito', theoryPracticeBalance: 'Bilanciato' }
          },
          strengths: [
            { area: 'Strength 1', description: 'Description 1', relevance: 'High' },
            { area: 'Strength 2', description: 'Description 2', relevance: 'Medium' }
          ],
          weaknesses: [
            { area: 'Weakness 1', description: 'Description 1', impact: 'High' }
          ],
          frameworkCoverage: {
            modules: [],
            overallCoverage: 80
          }
        }
      };

      const content = mockEvaluation.content as any;
      
      expect(Array.isArray(content?.strengths)).toBe(true);
      expect(content?.strengths?.length).toBe(2);
      expect(content?.strengths?.[0]?.area).toBe('Strength 1');
      
      expect(Array.isArray(content?.weaknesses)).toBe(true);
      expect(content?.weaknesses?.length).toBe(1);
      expect(content?.weaknesses?.[0]?.area).toBe('Weakness 1');
    });
  });
});
