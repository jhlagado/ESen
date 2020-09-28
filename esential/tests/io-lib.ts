import { i32 } from 'binaryen';
import { LibFunc } from '@jhlagado/esential';

export const ioLib: LibFunc = ({ external }) => {
  //
  const log = external({
    namespace: 'env',
    name: 'log',
    params: { a: i32 },
  });

  return {
    log,
  };
};
