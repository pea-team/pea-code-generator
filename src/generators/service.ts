import { Project, VariableDeclarationKind } from 'ts-morph'
import { join } from 'path'
import { capital, upper } from 'case'

import saveSourceFile from '../utils/saveSourceFile'
import { ServiceOptions } from '../types'

export function generateService(options: ServiceOptions) {
  const { name, baseDirPath = process.cwd() } = options
  const project = new Project()
  const outPath = join(baseDirPath, 'src', 'generated', 'services', `${name}.ts`)
  const NAME = upper(name)
  const Name = capital(name)
  const sourceFile = project.createSourceFile(outPath, undefined, {
    overwrite: true,
  })

  const actionTypes = ['create', 'update', 'delete']

  const methods = actionTypes.map(item => ({
    name: `${item}Name`,
    isAsync: true,
    parameters: [
      {
        name: 'input',
        type: `${capital(item)}${Name}Input`,
      },
    ],
    bodyText: `
      return await query(${upper(item)}_${NAME}, { variables: { input } })
    `,
  }))

  // import stook-graphql
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@common/stook-graphql',
    namedImports: ['query', 'fetcher'],
  })

  // import gql constants
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@generated/gql',
    namedImports: [
      `${NAME}S`,
      `UPDATE_${NAME}`,
      `CREATE_${NAME}`,
      `DELETE_${NAME}`,
      `${NAME}_AGGREGATE`,
    ],
  })

  // import types
  sourceFile.addImportDeclaration({
    moduleSpecifier: '@generated/types',
    namedImports: [`Update${Name}Input`, `Create${Name}Input`, `Delete${Name}Input`],
  })

  sourceFile.addClass({
    name: `${Name}Service`,
    methods: [
      ...methods,
      {
        name: `refetch${Name}s`,
        parameters: [
          {
            name: 'pageNo',
            type: 'number',
          },
          {
            name: 'pageSize',
            type: 'number',
          },
        ],
        statements: `
          fetcher.get(${NAME}S).refetch({
            variables: { skip: (pageNo - 1) * pageSize, first: pageSize },
          })
          fetcher.get(${NAME}_AGGREGATE).refetch()
        `,
      },
    ],
  })

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: `${name}Service`,
        initializer: `new ${Name}Service()`,
      },
    ],
    isExported: true,
  })

  saveSourceFile(sourceFile)
}
