/// <reference path="../pb_data/types.d.ts" />

// ETAPA 8 — CRM: observações/anotações internas vinculadas a cada cliente.
// Coleção owner-scoped; cada nota pertence a um cliente e ao usuário dono.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    const clients = app.findCollectionByNameOrId('clients');

    const collection = new Collection({
      type: 'base',
      name: 'client_notes',
      listRule: "@request.auth.id != '' && @request.auth.id = owner",
      viewRule: "@request.auth.id != '' && @request.auth.id = owner",
      createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
      updateRule: "@request.auth.id != '' && @request.auth.id = owner",
      deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
      fields: [
        {
          name: 'client_id',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: clients.id,
          cascadeDelete: true,
        },
        { name: 'text', type: 'text', required: true, max: 2000 },
        {
          name: 'kind',
          type: 'select',
          maxSelect: 1,
          values: ['Preferência', 'Atendimento', 'Comercial', 'Importante', 'Geral'],
        },
        {
          name: 'owner',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    });
    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('client_notes');
      app.delete(collection);
    } catch (e) {
      if (e.message.includes('no rows in result set')) {
        console.log('client_notes não encontrada, ignorando revert');
        return;
      }
      throw e;
    }
  },
);
