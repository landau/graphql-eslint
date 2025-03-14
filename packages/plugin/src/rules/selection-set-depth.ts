import type { AST } from 'eslint';
import { GraphQLESLintRule } from '../types';
import depthLimit from 'graphql-depth-limit';
import { DocumentNode, FragmentDefinitionNode, GraphQLError, Kind, OperationDefinitionNode } from 'graphql';
import { GraphQLESTreeNode } from '../estree-parser';
import { ARRAY_DEFAULT_OPTIONS, logger, requireSiblingsOperations } from '../utils';
import { SiblingOperations } from '../sibling-operations';

export type SelectionSetDepthRuleConfig = { maxDepth: number; ignore?: string[] };

const RULE_ID = 'selection-set-depth';

const rule: GraphQLESLintRule<[SelectionSetDepthRuleConfig]> = {
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      category: 'Operations',
      description: `Limit the complexity of the GraphQL operations solely by their depth. Based on [graphql-depth-limit](https://github.com/stems/graphql-depth-limit).`,
      url: `https://github.com/dotansimha/graphql-eslint/blob/master/docs/rules/${RULE_ID}.md`,
      requiresSiblings: true,
      examples: [
        {
          title: 'Incorrect',
          usage: [{ maxDepth: 1 }],
          code: `
            query deep2 {
              viewer { # Level 0
                albums { # Level 1
                  title # Level 2
                }
              }
            }
          `,
        },
        {
          title: 'Correct',
          usage: [{ maxDepth: 4 }],
          code: `
            query deep2 {
              viewer { # Level 0
                albums { # Level 1
                  title # Level 2
                }
              }
            }
          `,
        },
        {
          title: 'Correct (ignored field)',
          usage: [{ maxDepth: 1, ignore: ['albums'] }],
          code: `
            query deep2 {
              viewer { # Level 0
                albums { # Level 1
                  title # Level 2
                }
              }
            }
          `,
        },
      ],
      recommended: true,
      configOptions: [{ maxDepth: 7 }],
    },
    schema: {
      type: 'array',
      minItems: 1,
      maxItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['maxDepth'],
        properties: {
          maxDepth: {
            type: 'number',
          },
          ignore: ARRAY_DEFAULT_OPTIONS,
        },
      },
    },
  },
  create(context) {
    let siblings: SiblingOperations | null = null;

    try {
      siblings = requireSiblingsOperations(RULE_ID, context);
    } catch (e) {
      logger.warn(
        `Rule "${RULE_ID}" works best with siblings operations loaded. For more info: http://bit.ly/graphql-eslint-operations`
      );
    }

    const { maxDepth } = context.options[0];
    const ignore = context.options[0].ignore || [];
    const checkFn = depthLimit(maxDepth, { ignore });

    return {
      'OperationDefinition, FragmentDefinition'(
        node: GraphQLESTreeNode<OperationDefinitionNode | FragmentDefinitionNode>
      ) {
        try {
          const rawNode = node.rawNode();
          const fragmentsInUse = siblings ? siblings.getFragmentsInUse(rawNode) : [];
          const document: DocumentNode = {
            kind: Kind.DOCUMENT,
            definitions: [rawNode, ...fragmentsInUse],
          };

          checkFn({
            getDocument: () => document,
            reportError(error: GraphQLError) {
              const { line, column } = error.locations[0];
              context.report({
                loc: {
                  line,
                  column: column - 1,
                },
                message: error.message,
                suggest: [
                  {
                    desc: 'Remove selections',
                    fix(fixer) {
                      const ancestors = context.getAncestors();
                      const token = (ancestors[0] as AST.Program).tokens.find(
                        token => token.loc.start.line === line && token.loc.start.column === column - 1
                      );
                      const sourceCode = context.getSourceCode();
                      const foundNode = sourceCode.getNodeByRangeIndex(token.range[0]) as any;
                      const parentNode = foundNode.parent.parent;
                      return fixer.remove(foundNode.kind === 'Name' ? parentNode.parent : parentNode);
                    },
                  },
                ],
              });
            },
          });
        } catch (e) {
          logger.warn(
            `Rule "${RULE_ID}" check failed due to a missing siblings operations. For more info: http://bit.ly/graphql-eslint-operations`,
            e
          );
        }
      },
    };
  },
};

export default rule;
