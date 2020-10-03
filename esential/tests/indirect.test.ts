import { i32 } from 'binaryen';
import { esential, LibFunc, ops } from '../src';

export const indirectLib: LibFunc = ({ func }) => {
  //
  const {
    i32: { add },
  } = ops;
  
  const indirectAddition = func(
    { params: { a: i32, b: i32 }, indirect: true },

    (result, { a, b }) => {
      result(add(a, b));
    },
  );

  const indirect123 = func(
    { params: { a: i32, b: i32 }, result: i32 },

    (result, { a, b }) => {
      result(indirectAddition(a, b));
    },
  );

  return {
    indirectAddition,
    indirect123,
  };
};

const size = { initial: 10, maximum: 100 };

const { lib, load, compile } = esential({ table: { ...size } });
lib(indirectLib);

const exported = load(compile());

it('should add 2 numbers indirectly', () => {
  expect(exported.indirect123(300, 200)).toBe(500);
});
