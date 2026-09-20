/// <reference path="../pb_data/types.d.ts" />

// ETAPA 5 — Catálogo inteligente, modelos de serviço e base para estoque.
// Cria coleções: services, suppliers, products, equipment, epis, tools,
// service_models. Adiciona campos de itens (JSON) em quotes e service_orders
// para diferenciar "previsto no orçamento" de "realmente utilizado na execução".
// Não altera coleções/regras/automações existentes — apenas adiciona.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

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

    // 1. FORNECEDORES (criado antes de produtos para o vínculo funcionar)
    make("suppliers", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "category", type: "text", max: 80 },
      { name: "contact", type: "text", max: 200 },
      { name: "phone", type: "text", max: 40 },
      { name: "email", type: "text", max: 140 },
      { name: "notes", type: "text", max: 2000 },
    ]);

    const suppliers = app.findCollectionByNameOrId("suppliers");

    // 2. SERVIÇOS
    make("services", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "category", type: "text", max: 80 },
      { name: "description", type: "text", max: 2000 },
      { name: "unit", type: "text", max: 40 },
      { name: "base_price", type: "number" },
      { name: "notes", type: "text", max: 2000 },
    ]);

    // 3. PRODUTOS E MATERIAIS (preparado para estoque futuro)
    make("products", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "category", type: "text", max: 80 },
      { name: "description", type: "text", max: 2000 },
      { name: "unit", type: "text", max: 40 },
      { name: "cost", type: "number" }, // custo de aquisição
      { name: "price", type: "number" }, // preço de venda
      {
        name: "supplier_id",
        type: "relation",
        required: false,
        maxSelect: 1,
        collectionId: suppliers.id,
        cascadeDelete: false,
      },
      { name: "notes", type: "text", max: 2000 },
      // Campos preparados para estoque futuro (não usados ativamente nesta etapa):
      { name: "stock", type: "number" }, // quantidade em estoque
      { name: "min_stock", type: "number" }, // estoque mínimo
    ]);

    // 4. EQUIPAMENTOS
    make("equipment", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "category", type: "text", max: 80 },
      { name: "description", type: "text", max: 2000 },
      {
        name: "status",
        type: "select",
        maxSelect: 1,
        values: ["Disponível", "Em uso", "Em manutenção", "Indisponível"],
      },
      { name: "notes", type: "text", max: 2000 },
    ]);

    // 5. EPIs
    make("epis", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "category", type: "text", max: 80 },
      { name: "unit", type: "text", max: 40 },
      { name: "quantity", type: "number" },
      { name: "notes", type: "text", max: 2000 },
    ]);

    // 6. FERRAMENTAS
    make("tools", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "category", type: "text", max: 80 },
      { name: "unit", type: "text", max: 40 },
      { name: "quantity", type: "number" },
      { name: "notes", type: "text", max: 2000 },
    ]);

    // 7. MODELOS DE SERVIÇO
    // items: JSON array de line items (mesmo formato usado em orçamentos).
    //   { kind: 'service'|'product'|'equipment'|'epi'|'tool', ref, name, category, unit, qty, price, discount, cost }
    make("service_models", [
      { name: "name", type: "text", required: true, max: 140 },
      { name: "description", type: "text", max: 2000 },
      { name: "category", type: "text", max: 80 },
      { name: "items", type: "json", maxSize: 2000000 },
    ]);

    // 8. Adicionar campos de itens em quotes e service_orders (não obrigatórios).
    const quotes = app.findCollectionByNameOrId("quotes");
    if (!quotes.fields.getByName("items")) {
      quotes.fields.add(new JSONField({ name: "items", maxSize: 2000000 }));
    }
    if (!quotes.fields.getByName("discount")) {
      quotes.fields.add(new NumberField({ name: "discount" }));
    }
    app.save(quotes);

    const orders = app.findCollectionByNameOrId("service_orders");
    if (!orders.fields.getByName("items")) {
      orders.fields.add(new JSONField({ name: "items", maxSize: 2000000 }));
    }
    if (!orders.fields.getByName("used_items")) {
      orders.fields.add(new JSONField({ name: "used_items", maxSize: 2000000 }));
    }
    app.save(orders);
  },
  (app) => {
    // Reverte: remove campos adicionados e apaga coleções criadas.
    try {
      const quotes = app.findCollectionByNameOrId("quotes");
      if (quotes.fields.getByName("items")) quotes.fields.removeByName("items");
      if (quotes.fields.getByName("discount")) quotes.fields.removeByName("discount");
      app.save(quotes);
    } catch (_) {}
    try {
      const orders = app.findCollectionByNameOrId("service_orders");
      if (orders.fields.getByName("items")) orders.fields.removeByName("items");
      if (orders.fields.getByName("used_items")) orders.fields.removeByName("used_items");
      app.save(orders);
    } catch (_) {}
    ["service_models", "tools", "epis", "equipment", "products", "services", "suppliers"].forEach((n) => {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {}
    });
  },
);
