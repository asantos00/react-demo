import { useState } from "react";

function useRequestManager() {
  let [pendingRequestIds, setPendingRequestIds] = useState([]);
  let [hasError, setHasError] = useState(false);

  function create() {
    const requestId = Symbol();
    setPendingRequestIds([...pendingRequestIds, requestId]);
    setHasError(false);

    return {
      done() {
        setPendingRequestIds(pendingRequestIds =>
          pendingRequestIds.filter(id => id !== requestId)
        );
      },
      error() {
        setHasError(true);
      }
    };
  }

  return {
    create,
    hasPendingRequests: pendingRequestIds.length > 0,
    hasError
  };
}

export default useRequestManager;
