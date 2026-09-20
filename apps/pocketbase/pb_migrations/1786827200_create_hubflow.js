/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("business_name")) {
      users.fields.add(new TextField({ name: "business_name", max: 120 }));
    }
    if (!users.fields.getByName("phone")) {
      users.fields.add(new TextField({ name: "phone", max: 40 }));
    }
    users.createRule = "";
    app.save(users);

    const ownerField = () => ({
      name: "owner",
      type: "relation",
      required: true,
      maxSelect: 1,
      collectionId: users.id,
      cascadeDelete: true,
    });
    const stamps = [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];
    const rules = {
      listRule: "@request.auth.id != '' && @request.auth.id = owner",
      viewRule: "@request.auth.id != '' && @request.auth.id = owner",
      createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
      updateRule: "@request.auth.id != '' && @request.auth.id = owner",
      deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
    };

    const make = (name, fields) => {
      try {
        app.findCollectionByNameOrId(name);
        return;
      } catch (_) {
        const c = new Collection({
          type: "base",
          name,
          ...rules,
          fields: [...fields, ownerField(), ...stamps],
        });
        app.save(c);
      }
    };

    make("clients", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "phone", type: "text", max: 40 },
      { name: "whatsapp", type: "text", max: 40 },
      { name: "email", type: "text", max: 140 },
      { name: "document", type: "text", max: 40 },
      { name: "address", type: "text", max: 300 },
      { name: "notes", type: "text", max: 2000 },
    ]);

    make("quotes", [
      { name: "number", type: "text", max: 40 },
      { name: "client_name", type: "text", required: true, max: 140 },
      { name: "title", type: "text", max: 200 },
      { name: "description", type: "text", max: 2000 },
      { name: "amount", type: "number" },
      { name: "date", type: "text", max: 30 },
      {
        name: "status",
        type: "select",
        maxSelect: 1,
        values: ["Rascunho", "Enviado", "Aguardando resposta", "Aprovado", "Recusado"],
      },
    ]);

    make("service_orders", [
      { name: "number", type: "text", max: 40 },
      { name: "client_name", type: "text", required: true, max: 140 },
      { name: "service", type: "text", max: 200 },
      { name: "description", type: "text", max: 2000 },
      { name: "date", type: "text", max: 30 },
      { name: "time", type: "text", max: 20 },
      { name: "assignee", type: "text", max: 120 },
      { name: "amount", type: "number" },
      { name: "notes", type: "text", max: 2000 },
      {
        name: "status",
        type: "select",
        maxSelect: 1,
        values: ["Aberta", "Agendada", "Em andamento", "Concluída", "Cancelada"],
      },
    ]);

    make("appointments", [
      { name: "title", type: "text", required: true, max: 200 },
      { name: "client_name", type: "text", max: 140 },
      { name: "date", type: "text", max: 30 },
      { name: "time", type: "text", max: 20 },
      { name: "notes", type: "text", max: 1000 },
    ]);

    make("finance_entries", [
      { name: "description", type: "text", required: true, max: 200 },
      { name: "client_name", type: "text", max: 140 },
      { name: "amount", type: "number" },
      { name: "due_date", type: "text", max: 30 },
      { name: "kind", type: "select", maxSelect: 1, values: ["receber", "pagar"] },
      { name: "status", type: "select", maxSelect: 1, values: ["Pendente", "Pago", "Atrasado"] },
    ]);
  },
  (app) => {
    ["finance_entries", "appointments", "service_orders", "quotes", "clients"].forEach((n) => {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {
        /* ignore */
      }
    });
  },
);
