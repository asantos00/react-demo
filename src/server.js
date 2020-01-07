import { Server, Model, Factory, Response } from "miragejs";

export function makeServer({ environment = "development" } = {}) {
  let server = new Server({
    environment,

    models: {
      todo: Model
    },

    factories: {
      todo: Factory.extend({
        text(i) {
          return `Todo ${i + 1}`;
        },

        isDone: false
      })
    },

    seeds(server) {
      server.create("todo", { text: "Buy groceries", isDone: false });
      server.create("todo", { text: "Walk the dog", isDone: false });
      server.create("todo", { text: "Do laundry", isDone: false });
    },

    routes() {
      this.namespace = "api";
      this.timing = 4000;

      this.get("/todos", ({ db }) => {
        return db.todos;
      });

      this.patch("/todos/:id", (schema, request) => {
        return new Response(500);
      });

      this.post("/todos", (schema, request) => {
        let todo = JSON.parse(request.requestBody);

        return schema.db.todos.insert(todo);
      });

      this.delete("/todos/:id", (schema, request) => {
        return new Response(500);
      });
    }
  });

  return server;
}
