import type { Rule, AST, Linter } from 'eslint';
import type * as ESTree from 'estree';
import type { ASTNode, GraphQLSchema } from 'graphql';
import type { IExtensions, IGraphQLProject, DocumentPointer, SchemaPointer } from 'graphql-config';
import type { GraphQLParseOptions } from '@graphql-tools/utils';
import type { GraphQLESLintRuleListener } from './testkit';
import type { GraphQLESTreeNode } from './estree-parser';
import type { SiblingOperations } from './sibling-operations';

export interface ParserOptions {
  schema?: SchemaPointer | Record<string, { headers: Record<string, string> }>;
  documents?: DocumentPointer;
  operations?: DocumentPointer; // legacy
  extensions?: IExtensions;
  include?: string | string[];
  exclude?: string | string[];
  projects?: Record<string, IGraphQLProject>;
  schemaOptions?: Omit<GraphQLParseOptions, 'assumeValidSDL'> & {
    headers: Record<string, string>;
  };
  graphQLParserOptions?: Omit<GraphQLParseOptions, 'noLocation'>;
  skipGraphQLConfig?: boolean;
  filePath?: string;
}

export type ParserServices = {
  hasTypeInfo: boolean;
  schema: GraphQLSchema | null;
  siblingOperations: SiblingOperations;
};

export type GraphQLESLintParseResult = Linter.ESLintParseResult & {
  services: ParserServices;
};

type ReportDescriptorLocation = { node: GraphQLESTreeNode<ASTNode> } | { loc: AST.SourceLocation | ESTree.Position };
export type ReportDescriptor = Rule.ReportDescriptorMessage & Rule.ReportDescriptorOptions & ReportDescriptorLocation;

export type GraphQLESLintRuleContext<Options = any[]> = Omit<
  Rule.RuleContext,
  'parserServices' | 'report' | 'options'
> & {
  options: Options;
  report(descriptor: ReportDescriptor): void;
  parserServices?: ParserServices;
};

export type CategoryType = 'Schema' | 'Operations';

export type RuleDocsInfo<T> = {
  docs: Omit<Rule.RuleMetaData['docs'], 'category'> & {
    category: CategoryType | CategoryType[];
    requiresSchema?: true;
    requiresSiblings?: true;
    examples?: {
      title: string;
      code: string;
      usage?: T;
    }[];
    configOptions?:
      | T
      | {
          schema?: T;
          operations?: T;
        };
    graphQLJSRuleName?: string;
    isDisabledForAllConfig?: true;
  };
};

export type GraphQLESLintRule<Options = any[], WithTypeInfo extends boolean = false> = {
  create(context: GraphQLESLintRuleContext<Options>): GraphQLESLintRuleListener<WithTypeInfo>;
  meta: Omit<Rule.RuleMetaData, 'docs'> & RuleDocsInfo<Options>;
};

export type ValueOf<T> = T[keyof T];

// eslint-disable-next-line @typescript-eslint/ban-types -- Cosmetic use only, makes the tooltips expand the type can be removed
type Id<T> = {} & { [P in keyof T]: T[P] };
// eslint-disable-next-line no-use-before-define
type OmitDistributive<T, K extends PropertyKey> = T extends object ? Id<OmitRecursively<T, K>> : T;
export type OmitRecursively<T extends object, K extends PropertyKey> = Omit<
  { [P in keyof T]: OmitDistributive<T[P], K> },
  K
>;
