/// <reference path="../pb_data/types.d.ts" />

// ETAPA 3 — Automatizar o fluxo principal da HubFlow.
// Adiciona campos de vínculo (rastreabilidade) entre os módulos e o
// status "Cancelado" no financeiro, sem alterar coleções/funcionalidades
// existentes.

migrate(
  (app) => {
    const quotes = app.findCollectionByNameOrId("quotes");
    const orders = app.findCollectionByNameOrId("service_orders");

    // 1. service_orders -> quote (origem da OS)
    if (!orders.fields.getByName("quote_id")) {
      orders.fields.add(
        new RelationField({
          name: "quote_id",
          required: false,
          maxSelect: 1,
          collectionId: quotes.id,
          cascadeDelete: false,
        }),
      );
    }

    // 2. appointments -> service_order (origem do agendamento)
    const appointments = app.findCollectionByNameOrId("appointments");
    if (!appointments.fields.getByName("order_id")) {
      appointments.fields.add(
        new RelationField({
          name: "order_id",
          required: false,
          maxSelect: 1,
          collectionId: orders.id,
          cascadeDelete: false,
        }),
      );
    }

    // 3. finance_entries -> service_order (origem da conta a receber)
    const finance = app.findCollectionByNameOrId("finance_entries");
    if (!finance.fields.getByName("order_id")) {
      finance.fields.add(
        new RelationField({
          name: "order_id",
          required: false,
          maxSelect: 1,
          collectionId: orders.id,
          cascadeDelete: false,
        }),
      );
    }

    // 4. finance_entries.status: adicionar "Cancelado"
    const statusField = finance.fields.getByName("status");
    if (statusField && !statusField.values.includes("Cancelado")) {
      statusField.values = ["Pendente", "Pago", "Atrasado", "Cancelado"];
    }

    app.save(orders);
    app.save(appointments);
    app.save(finance);
  },
  (app) => {
    const appointments = app.findCollectionByNameOrId("appointments");
    const finance = app.findCollectionByNameOrId("finance_entries");
    const orders = app.findCollectionByNameOrId("service_orders");

    if (appointments.fields.getByName("order_id")) {
      appointments.fields.removeByName("order_id");
      app.save(appointments);
    }
    if (finance.fields.getByName("order_id")) {
      finance.fields.removeByName("order_id");
      const statusField = finance.fields.getByName("status");
      if (statusField) statusField.values = ["Pendente", "Pago", "Atrasado"];
      app.save(finance);
    }
    if (orders.fields.getByName("quote_id")) {
      orders.fields.removeByName("quote_id");
      app.save(orders);
    }
  },
);
