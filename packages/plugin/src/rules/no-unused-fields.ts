import { GraphQLSchema, TypeInfo, visit, visitWithTypeInfo } from 'graphql';
import { GraphQLESLintRule } from '../types';
import { requireGraphQLSchemaFromContext, requireSiblingsOperations } from '../utils';
import { SiblingOperations } from '../sibling-operations';

const RULE_ID = 'no-unused-fields';

type UsedFields = Record<string, Set<string>>;

let usedFieldsCache: UsedFields;

function getUsedFields(schema: GraphQLSchema, operations: SiblingOperations): UsedFields {
  // We don't want cache usedFields on test environment
  // Otherwise usedFields will be same for all tests
  if (process.env.NODE_ENV !== 'test' && usedFieldsCache) {
    return usedFieldsCache;
  }
  const usedFields: UsedFields = Object.create(null);
  const typeInfo = new TypeInfo(schema);

  const visitor = visitWithTypeInfo(typeInfo, {
    Field(node): false | void {
      const fieldDef = typeInfo.getFieldDef();
      if (!fieldDef) {
        // skip visiting this node if field is not defined in schema
        return false;
      }
      const parentTypeName = typeInfo.getParentType().name;
      const fieldName = node.name.value;

      usedFields[parentTypeName] ??= new Set();
      usedFields[parentTypeName].add(fieldName);
    },
  });

  const allDocuments = [...operations.getOperations(), ...operations.getFragments()];
  for (const { document } of allDocuments) {
    visit(document, visitor);
  }
  usedFieldsCache = usedFields;
  return usedFieldsCache;
}

const rule: GraphQLESLintRule = {
  meta: {
    messages: {
      [RULE_ID]: `Field "{{fieldName}}" is unused`,
    },
    docs: {
      description: `Requires all fields to be used at some level by siblings operations.`,
      category: 'Schema',
      url: `https://github.com/dotansimha/graphql-eslint/blob/master/docs/rules/${RULE_ID}.md`,
      requiresSiblings: true,
      requiresSchema: true,
      isDisabledForAllConfig: true,
      examples: [
        {
          title: 'Incorrect',
          code: /* GraphQL */ `
            type User {
              id: ID!
              name: String
              someUnusedField: String
            }

            type Query {
              me: User
            }

            query {
              me {
                id
                name
              }
            }
          `,
        },
        {
          title: 'Correct',
          code: /* GraphQL */ `
            type User {
              id: ID!
              name: String
            }

            type Query {
              me: User
            }

            query {
              me {
                id
                name
              }
            }
          `,
        },
      ],
    },
    type: 'suggestion',
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    const schema = requireGraphQLSchemaFromContext(RULE_ID, context);
    const siblingsOperations = requireSiblingsOperations(RULE_ID, context);
    const usedFields = getUsedFields(schema, siblingsOperations);

    return {
      FieldDefinition(node) {
        const fieldName = node.name.value;
        const parentTypeName = (node as any).parent.name.value;
        const isUsed = usedFields[parentTypeName]?.has(fieldName);

        if (isUsed) {
          return;
        }

        context.report({
          node: node.name,
          messageId: RULE_ID,
          data: { fieldName },
          suggest: [
            {
              desc: `Remove \`${fieldName}\` field`,
              fix(fixer) {
                const sourceCode = context.getSourceCode() as any;
                const tokenBefore = sourceCode.getTokenBefore(node);
                const tokenAfter = sourceCode.getTokenAfter(node);
                const isEmptyType = tokenBefore.type === '{' && tokenAfter.type === '}';

                return isEmptyType ? fixer.remove((node as any).parent) : fixer.remove(node as any);
              },
            },
          ],
        });
      },
    };
  },
};

export default rule;
