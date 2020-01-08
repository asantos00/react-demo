import React, { useEffect, useState } from "react";
import useIsMountedRef from "../hooks/useIsMountedRef";
import useRefState from "../hooks/useRefState";

let tempIdCounter = 1;

export default function Todos() {
  let [todos, setTodos] = useState([]);
  let isMountedRef = useIsMountedRef();
  let [newTodoRef, setNewTodoRef] = useRefState({ text: "", isDone: false });
  let done = todos.filter(todo => todo.isDone).length;

  const updateLocalTodos = (todo, index) => {
    setTodos(todos => {
      return todos.map((oldTodo, i) => (i === index ? todo : oldTodo));
    });
  };

  async function createTodo(event) {
    event.preventDefault();
    let newTodo = { ...newTodoRef.current };
    let tempId = `t${tempIdCounter}`;
    tempIdCounter++;
    let latestTodos = [...todos, { ...newTodo, ...{ id: tempId } }];
    setTodos(latestTodos);
    setNewTodoRef({ text: "", isDone: false });
  }

  async function saveTodo(todo) {
    let index = todos.findIndex(t => t.id === todo.id);
    updateLocalTodos(todo, index);
  }

  async function deleteCompleted() {
    let remainingTodos = todos.filter(t => !t.isDone);

    setTodos(remainingTodos);
  }

  function handleChange(event) {
    setNewTodoRef({ ...newTodoRef.current, ...{ text: event.target.value } });
  }

  useEffect(() => {
    setTodos([
      { isDone: false, text: 'My cool TODO', id: 1 }
    ])
  }, [isMountedRef]);

  return (
    <div className="max-w-sm px-4 py-6 mx-auto bg-white rounded shadow-lg">
      <div className="flex items-center justify-between px-3">
        <h1 className="text-2xl font-bold">Todos</h1>
      </div>

      <div className="mt-6">
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
      </div>
    </div>
  );
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
