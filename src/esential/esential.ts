import { Module } from 'binaryen';
import {
  Callable,
  LibFunc,
  Lib,
  Esential,
  Dict,
  MemDef,
  IndirectInfo,
  Ref,
  Imports,
} from './types';
import { CompileOptions } from './types';
import { FEATURE_MULTIVALUE } from './constants';
import { getFunc, getExternalFunc, getLiteral, exportFuncs } from './lib-utils';
import { getFOR, getIF } from './control';

export const esential = (): Esential => {
  // let memoryDef: MemDef = null;
  // let tableDef: TableDef = null;
  // let externalDefs: ExternalDef[] = [];

  const module = new Module();
  module.setFeatures(FEATURE_MULTIVALUE);
  module.autoDrop();

  const importsRef: Ref<Imports> = { current: {} };
  const callableIdMap = new Map<Callable, string>();
  const callableIndirectMap = new Map<Callable, IndirectInfo>();
  const libMap = new Map<LibFunc, Lib>();
  const exportedSet = new Set<Callable>();
  const indirectTable: IndirectInfo[] = [];

  const compile = ({
    optimize = true,
    validate = true,
    memDef,
    tableDef = {},
  }: CompileOptions = {}): any => {
    if (memDef) {
      const {
        namespace: memoryNamespace = 'env',
        name: memoryName = 'memory',
        initial: memoryInitial = 10,
        maximum: memoryMaximum = 100,
      } = memDef;
      module.addMemoryImport('0', memoryNamespace, memoryName);
      module.setMemory(memoryInitial, memoryMaximum, memoryName);
    }
    const ids = indirectTable.map(item => item.id);
    const { length } = ids;
    if (length > 0) {
      const {
        namespace: tableNamespace = 'env',
        name: tableName = 'table',
        initial: tableInitial = 10,
        maximum: tableMaximum = 100,
      } = tableDef;
      module.addTableImport('0', tableNamespace, tableName);
      (module.setFunctionTable as any)(
        Math.max(length, tableInitial),
        Math.max(length, tableMaximum),
        ids,
      ); // because .d.ts is wrong
    }
    if (optimize) module.optimize();
    if (validate && !module.validate()) throw new Error('validation error');
    return module.emitBinary();
  };

  const load = (binary: Uint8Array, imports: Dict<Dict<any>> = { env: {} }): any => {
    const wasmModule = new WebAssembly.Module(binary);
    const instance = new WebAssembly.Instance(wasmModule, imports);
    return instance.exports;
  };

  const esen: Esential = {
    module,

    lib(libFunc: LibFunc, args: Dict<any> = {}) {
      if (libMap.has(libFunc)) {
        return libMap.get(libFunc);
      }
      const lib = libFunc(esen, args);
      exportFuncs(module, lib, exportedSet, callableIdMap);
      libMap.set(libFunc, lib);
      return lib;
    },

    memory(def: MemDef): any {
      const { namespace = 'namespace', name = 'name', initial = 10, maximum = 100 } = def;
      const memObj = new WebAssembly.Memory({
        initial,
        maximum,
      });
      importsRef.current = {
        ...importsRef.current,
        [namespace]: {
          ...importsRef.current[namespace],
          [name]: memObj,
        },
      };
      module.addMemoryImport('0', namespace, name);
      module.setMemory(initial, maximum, name);
    },

    func: getFunc(module, callableIdMap, exportedSet),
    indirect: getFunc(module, callableIdMap, exportedSet, indirectTable),
    external: getExternalFunc(module, callableIdMap, importsRef),

    getIndirectInfo(callable: Callable) {
      return callableIndirectMap.get(callable);
    },

    literal: getLiteral(module),
    FOR: getFOR(module),
    IF: getIF(module),
    compile,
    load,
  };
  return esen;
};