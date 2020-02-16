import { Project, VariableDeclarationKind } from 'ts-morph'
import { sep, join } from 'path'
import { readFileSync } from 'fs'
import { find } from 'fs-jetpack'
import { upper } from 'case'

import saveSourceFile from '../utils/saveSourceFile'
import { GqlOptions } from '../types'

export function generateGql(options: GqlOptions) {
  const {
    baseDirPath = process.cwd(),
    outPath = join(process.cwd(), 'generated', 'gql.ts'),
  } = options
  const project = new Project()
  const dirNames = ['queries', 'mutations', 'subscriptions']

  const sourceFile = project.createSourceFile(outPath, undefined, {
    overwrite: true,
  })

  // import gql-tag
  sourceFile.addImportDeclaration({
    moduleSpecifier: 'gql-tag',
    defaultImport: 'gql',
  })

  for (const name of dirNames) {
    const dir = join(baseDirPath, 'gql', name)
    find(dir, {
      matching: '*.gql',
    }).forEach(item => {
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: getName(item),
            initializer: getGqlString(item),
          },
        ],
        isExported: true,
      })
    })
  }

  saveSourceFile(sourceFile)
}

function getName(path: string) {
  const arr = path.split(sep)
  const name = arr[arr.length - 1].replace('.gql', '')
  return upper(name, '_')
}

function getGqlString(path: string) {
  const gqlString = readFileSync(path, { encoding: 'utf8' })
  return 'gql' + '`' + '\n' + gqlString + '\n' + '`'
}
