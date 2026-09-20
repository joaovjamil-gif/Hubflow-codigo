/// <reference path="../pb_data/types.d.ts" />

// ETAPA 6 — Estoque e Gestão de Materiais.
// 1. Adiciona Unidade de medida (select) + Unidade personalizada (text) em products.
//    Os campos existentes (unit, stock, min_stock, cost, price, supplier_id) são preservados.
// 2. Cria a coleção stock_movements para registrar Entrada/Saída/Ajuste por produto,
//    com vínculo opcional à OS (order_id) para rastreabilidade da utilização real.
// Não altera coleções, regras ou automações já validadas — apenas adiciona.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // 1. Adiciona campos de unidade de medida em products (idempotente).
    const products = app.findCollectionByNameOrId("products");
    if (!products.fields.getByName("unit_measure")) {
      products.fields.add(
        new SelectField({
          name: "unit_measure",
          required: false,
          maxSelect: 1,
          values: [
            "un",
            "m",
            "cm",
            "kg",
            "g",
            "L",
            "ml",
            "caixa",
            "pacote",
            "par",
            "rolo",
            "kit",
            "outro",
          ],
        }),
      );
    }
    if (!products.fields.getByName("unit_custom")) {
      products.fields.add(
        new TextField({ name: "unit_custom", required: false, max: 40 }),
      );
    }
    app.save(products);

    // 2. Cria a coleção stock_movements (owner-scoped).
    try {
      app.findCollectionByNameOrId("stock_movements");
    } catch (_) {
      const orders = app.findCollectionByNameOrId("service_orders");
      const c = new Collection({
        type: "base",
        name: "stock_movements",
        listRule:
          "@request.auth.id != '' && @request.auth.id = owner",
        viewRule:
          "@request.auth.id != '' && @request.auth.id = owner",
        createRule:
          "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule:
          "@request.auth.id != '' && @request.auth.id = owner",
        deleteRule:
          "@request.auth.id != '' && @request.auth.id = owner",
        fields: [
          {
            name: "product_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: products.id,
            cascadeDelete: false,
          },
          {
            name: "type",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["Entrada", "Saída", "Ajuste"],
          },
          { name: "quantity", type: "number" },
          { name: "unit", type: "text", max: 40 },
          { name: "date", type: "text", max: 30 },
          { name: "responsible", type: "text", max: 120 },
          { name: "notes", type: "text", max: 2000 },
          { name: "source", type: "text", max: 40 },
          {
            name: "order_id",
            type: "relation",
            required: false,
            maxSelect: 1,
            collectionId: orders.id,
            cascadeDelete: false,
          },
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
      app.save(c);
    }
  },
  (app) => {
    // Reverte: remove campos adicionados e apaga a coleção criada.
    try {
      const products = app.findCollectionByNameOrId("products");
      if (products.fields.getByName("unit_measure"))
        products.fields.removeByName("unit_measure");
      if (products.fields.getByName("unit_custom"))
        products.fields.removeByName("unit_custom");
      app.save(products);
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId("stock_movements"));
    } catch (_) {}
  },
);
