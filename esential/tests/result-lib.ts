import { LibFunc } from '../src';

export const resultLib: LibFunc = ({ func, block }) => {
  //
  const return1000 = func(
    { params: {} },

    (result, {}) => {
      result(1000);
    },
  );

  const return2000 = func(
    {},

    (result, { u }) => {
      result(
        //
        // block(
          //
          u(1000),
          u,
        // ),
      );
    },
  );

  return {
    return1000,
    return2000,
  };
};
