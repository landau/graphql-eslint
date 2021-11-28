/*
 * 🚨 IMPORTANT! Do not manually modify this file. Run: `yarn generate-configs`
 */

export default {
  extends: ['plugin:@graphql-eslint/base'],
  rules: {
    '@graphql-eslint/description-style': 'error',
    '@graphql-eslint/known-argument-names': 'error',
    '@graphql-eslint/known-directives': 'error',
    '@graphql-eslint/known-type-names': 'error',
    '@graphql-eslint/lone-schema-definition': 'error',
    '@graphql-eslint/naming-convention': [
      'error',
      {
        types: 'PascalCase',
        FieldDefinition: 'camelCase',
        InputValueDefinition: 'camelCase',
        Argument: 'camelCase',
        DirectiveDefinition: 'camelCase',
        EnumValueDefinition: 'UPPER_CASE',
        'FieldDefinition[parent.name.value=Query]': {
          forbiddenPrefixes: ['query', 'get'],
          forbiddenSuffixes: ['Query'],
        },
        'FieldDefinition[parent.name.value=Mutation]': {
          forbiddenPrefixes: ['mutation'],
          forbiddenSuffixes: ['Mutation'],
        },
        'FieldDefinition[parent.name.value=Subscription]': {
          forbiddenPrefixes: ['subscription'],
          forbiddenSuffixes: ['Subscription'],
        },
      },
    ],
    '@graphql-eslint/no-case-insensitive-enum-values-duplicates': 'error',
    '@graphql-eslint/no-hashtag-description': 'error',
    '@graphql-eslint/no-typename-prefix': 'error',
    '@graphql-eslint/no-unreachable-types': 'error',
    '@graphql-eslint/provided-required-arguments': 'error',
    '@graphql-eslint/require-deprecation-reason': 'error',
    '@graphql-eslint/require-description': ['error', { types: true, DirectiveDefinition: true }],
    '@graphql-eslint/strict-id-in-types': 'error',
    '@graphql-eslint/unique-directive-names': 'error',
    '@graphql-eslint/unique-directive-names-per-location': 'error',
    '@graphql-eslint/unique-field-definition-names': 'error',
    '@graphql-eslint/unique-operation-types': 'error',
    '@graphql-eslint/unique-type-names': 'error',
  },
};
