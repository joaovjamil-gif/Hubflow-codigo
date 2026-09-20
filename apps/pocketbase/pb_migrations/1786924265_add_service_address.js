/// <reference path="../pb_data/types.d.ts" />

// ETAPA 4 — Localização da ordem de serviço.
// Adiciona o campo de endereço do serviço na OS e um campo de endereço
// espelho no agendamento (sincronizado a partir da OS). Não altera regras,
// status nem automações existentes.

migrate(
  (app) => {
    // 1. service_orders -> service_address (endereço onde o serviço será feito)
    const orders = app.findCollectionByNameOrId("service_orders");
    if (!orders.fields.getByName("service_address")) {
      orders.fields.add(
        new TextField({ name: "service_address", max: 400 }),
      );
    }
    app.save(orders);

    // 2. appointments -> address (espelho sincronizado da OS vinculada)
    const appointments = app.findCollectionByNameOrId("appointments");
    if (!appointments.fields.getByName("address")) {
      appointments.fields.add(
        new TextField({ name: "address", max: 400 }),
      );
    }
    app.save(appointments);
  },
  (app) => {
    try {
      const orders = app.findCollectionByNameOrId("service_orders");
      if (orders.fields.getByName("service_address")) {
        orders.fields.removeByName("service_address");
        app.save(orders);
      }
    } catch (_) {}
    try {
      const appointments = app.findCollectionByNameOrId("appointments");
      if (appointments.fields.getByName("address")) {
        appointments.fields.removeByName("address");
        app.save(appointments);
      }
    } catch (_) {}
  },
);
