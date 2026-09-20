/// <reference path="../pb_data/types.d.ts" />

// ETAPA 7 — Financeiro Avançado e Dashboard Analítico.
// 1. finance_entries: adiciona category, payment_date e notes (observação).
//    Não altera campos/regras/automações existentes.
// 2. Cria a coleção goals (metas empresariais, owner-scoped).
// 3. Cria a coleção trash (lixeira de registros excluídos, owner-scoped).
// Categorias são armazenadas como text para permitir categorias personalizadas
// futuras sem quebrar as existentes.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // 1. finance_entries — novos campos (idempotentes).
    const finance = app.findCollectionByNameOrId("finance_entries");

    if (!finance.fields.getByName("category")) {
      finance.fields.add(
        new TextField({ name: "category", required: false, max: 80 }),
      );
    }
    if (!finance.fields.getByName("payment_date")) {
      finance.fields.add(
        new TextField({ name: "payment_date", required: false, max: 30 }),
      );
    }
    if (!finance.fields.getByName("notes")) {
      finance.fields.add(
        new TextField({ name: "notes", required: false, max: 2000 }),
      );
    }
    app.save(finance);

    // 2. goals — metas empresariais.
    try {
      app.findCollectionByNameOrId("goals");
    } catch (_) {
      const goals = new Collection({
        type: "base",
        name: "goals",
        listRule: "@request.auth.id != '' && @request.auth.id = owner",
        viewRule: "@request.auth.id != '' && @request.auth.id = owner",
        createRule:
          "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule: "@request.auth.id != '' && @request.auth.id = owner",
        deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
        fields: [
          {
            name: "type",
            type: "select",
            required: true,
            maxSelect: 1,
            values: [
              "faturamento",
              "novos_clientes",
              "orcamentos",
              "servicos_concluidos",
            ],
          },
          {
            name: "period_type",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["mensal", "trimestral", "anual"],
          },
          { name: "period_ref", type: "text", required: true, max: 20 },
          { name: "target", type: "number", required: true },
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(goals);
    }

    // 3. trash — lixeira de registros excluídos.
    try {
      app.findCollectionByNameOrId("trash");
    } catch (_) {
      const trash = new Collection({
        type: "base",
        name: "trash",
        listRule: "@request.auth.id != '' && @request.auth.id = owner",
        viewRule: "@request.auth.id != '' && @request.auth.id = owner",
        createRule:
          "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule: "@request.auth.id != '' && @request.auth.id = owner",
        deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
        fields: [
          { name: "collection_name", type: "text", required: true, max: 80 },
          { name: "record_id", type: "text", required: true, max: 40 },
          { name: "summary", type: "text", required: false, max: 300 },
          { name: "data", type: "json", required: true, maxSize: 5000000 },
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(trash);
    }
  },
  (app) => {
    // Reverte: remove campos adicionados e apaga coleções criadas.
    try {
      const finance = app.findCollectionByNameOrId("finance_entries");
      if (finance.fields.getByName("category"))
        finance.fields.removeByName("category");
      if (finance.fields.getByName("payment_date"))
        finance.fields.removeByName("payment_date");
      if (finance.fields.getByName("notes"))
        finance.fields.removeByName("notes");
      app.save(finance);
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId("goals"));
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId("trash"));
    } catch (_) {}
  },
);
