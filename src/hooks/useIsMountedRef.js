import { useEffect, useRef } from 'react';
const useIsMountedRef = () => {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

export default useIsMountedRef;
