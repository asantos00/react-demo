import React, { useEffect, useState, useRef } from "react";

const useIsMountedRef = () => {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};

let tempIdCounter = 1;

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

export default function Todos() {
  let manager = useRequestManager();
  let [todos, setTodos] = useState([]);
  let [isLoading, setIsLoading] = useState(true);
  let [getHasError, setHasError] = useState(false);
  let isMountedRef = useIsMountedRef();
  let [newTodoRef, setNewTodoRef] = useRefState({ text: "", isDone: false });

  let isSaving = manager.hasPendingRequests;
  let hasError = manager.hasError || getHasError;

  let done = todos.filter(todo => todo.isDone).length;

  async function createTodo(event) {
    event.preventDefault();
    let newTodo = { ...newTodoRef.current };
    let tempId = `t${tempIdCounter}`;
    tempIdCounter++;
    let latestTodos = [...todos, { ...newTodo, ...{ id: tempId } }];
    setTodos(latestTodos);
    setNewTodoRef({ text: "", isDone: false });

    let request = manager.create();
    let json = await fetch("/api/todos", {
      method: "POST",
      body: JSON.stringify(newTodo)
    })
      .then(res => res.json())
      .catch(e => {
        request.error();
      });

    if (isMountedRef.current) {
      // Update client side cache with record from server
      let index = latestTodos.findIndex(todo => todo.id === tempId);
      setTodos(todos => {
        return todos.map((oldTodo, i) => (i === index ? json : oldTodo));
      });

      request.done();
    }
  }

  async function saveTodo(todo) {
    let request = manager.create();
    let index = todos.findIndex(t => t.id === todo.id);
    setTodos(
      todos.map((oldTodo, i) => {
        if (i === index) {
          return todo;
        }

        return oldTodo;
      })
    );

    fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      body: JSON.stringify(todo)
    })
      .then(res => {
        if (res.status > 300) {
          return Promise.reject(res);
        }
      })
      .catch(e => {
        request.error();
      })
      .finally(() => {
        request.done();
      });
  }

  async function deleteCompleted() {
    let request = manager.create();
    let completedTodos = todos.filter(t => t.isDone);
    let remainingTodos = todos.filter(t => !t.isDone);

    setTodos(remainingTodos);

    Promise.all(
      completedTodos.map(todo =>
        fetch(`/api/todos/${todo.id}`, { method: "DELETE" }).then(res => {
          if (res.status > 300) {
            return Promise.reject(res);
          }
        })
      )
    )
      .catch(e => {
        console.log(e);
        request.error();
      })
      .finally(() => {
        if (isMountedRef.current) {
          request.done();
        }
      });
  }

  function handleChange(event) {
    setNewTodoRef({ ...newTodoRef.current, ...{ text: event.target.value } });
  }

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    fetch("/api/todos")
      .then(res => {
        if (res.status > 300) {
          return Promise.reject(res);
        }

        return res;
      })
      .then(res => res.json())
      .then(json => {
        if (isMountedRef.current) {
          setTodos(json);
        }
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isMountedRef]);

  return (
    <div className="max-w-sm px-4 py-6 mx-auto bg-white rounded shadow-lg">
      <div className="flex items-center justify-between px-3">
        <h1 className="text-2xl font-bold">Todos</h1>

        <div className={hasError ? "text-red-500" : "text-blue-500"}>
          {hasError ? (
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 20 20"
              data-testid="error"
            >
              <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1z" />
            </svg>
          ) : (
            isSaving && (
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 20 20"
                data-testid="saving"
              >
                <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1z" />
              </svg>
            )
          )}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="px-3 text-gray-500" data-testid="loading">
            Loading...
          </p>
        ) : (
          <div>
            <div className="px-3">
              <form onSubmit={createTodo} data-testid="new-todo-form">
                <input
                  type="text"
                  value={newTodoRef.current.text}
                  onChange={handleChange}
                  placeholder="New todo"
                  className="block w-full px-3 py-2 placeholder-gray-500 bg-white rounded shadow focus:outline-none"
                />
              </form>
            </div>

            {todos.length > 0 ? (
              <ul className="mt-8">
                {todos.map(todo => (
                  <Todo todo={todo} onChange={saveTodo} key={todo.id} />
                ))}
              </ul>
            ) : (
              <p
                className="px-3 mt-16 text-lg text-center text-gray-500"
                data-testid="no-todos"
              >
                Everything's done!
              </p>
            )}

            <div className="flex justify-between px-3 mt-12 text-sm font-medium text-gray-500">
              {todos.length > 0 ? (
                <p>
                  {done} / {todos.length} complete
                </p>
              ) : null}
              {done > 0 ? (
                <button
                  onClick={deleteCompleted}
                  className="font-medium text-blue-500 focus:outline-none focus:text-blue-300"
                >
                  Clear completed
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useRefState(initialState) {
  let [state, setState] = useState(initialState);
  let ref = useRef(state);

  function updateRefAndSetState(newState) {
    ref.current = newState;
    setState(newState);
  }

  return [ref, updateRefAndSetState];
}

function Todo({ todo, onChange }) {
  let [isFocused, setIsFocused] = useState(false);
  let [localTodoRef, setLocalTodo] = useRefState({ ...todo });

  function handleChange(event) {
    setLocalTodo({ ...localTodoRef.current, ...{ text: event.target.value } });
  }

  function handleCheck(event) {
    setLocalTodo({
      ...localTodoRef.current,
      ...{ isDone: event.target.checked }
    });

    commitChanges();
  }

  function handleSubmit(event) {
    event.preventDefault();
    commitChanges(localTodoRef.current);
  }

  function commitChanges() {
    setIsFocused(false);

    let hasChanges =
      localTodoRef.current.text !== todo.text ||
      localTodoRef.current.isDone !== todo.isDone;

    if (hasChanges) {
      onChange(localTodoRef.current);
    }
  }

  return (
    <li
      className={`
        my-1 rounded focus:bg-white border-2 flex items-center relative
        ${isFocused ? "bg-white border-gray-300" : ""}
        ${!isFocused ? "border-transparent hover:bg-gray-200" : ""}
        ${!isFocused && localTodoRef.current.isDone ? "opacity-50" : ""}
      `}
      data-testid="todo"
    >
      <input
        type="checkbox"
        checked={localTodoRef.current.isDone}
        onChange={handleCheck}
        className="ml-2"
      />

      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          value={localTodoRef.current.text}
          onChange={handleChange}
          placeholder="New Todo"
          onFocus={() => setIsFocused(true)}
          onBlur={commitChanges}
          className={`
            bg-transparent focus:outline-none px-3 py-1 block w-full
            ${localTodoRef.current.isDone && !isFocused ? "line-through" : ""}
          `}
        />
      </form>
    </li>
  );
}
