/// <reference path="../pb_data/types.d.ts" />

// ETAPA 4 — Data de vencimento obrigatória + estado "Vencido".
// - due_date passa a ser obrigatório para novos lançamentos.
// - status passa a reconhecer: Pendente, Pago, Vencido, Cancelado.
//   ("Atrasado" é migrado para "Pendente" — o estado "Vencido" é derivado
//    automaticamente no frontend a partir da data de vencimento vencida.)
// - Lançamentos existentes são preservados.

migrate(
  (app) => {
    const finance = app.findCollectionByNameOrId("finance_entries");

    // 1. due_date obrigatório
    const dueField = finance.fields.getByName("due_date");
    if (dueField) {
      dueField.required = true;
    }

    // 2. status: substituir "Atrasado" por "Vencido"
    const statusField = finance.fields.getByName("status");
    if (statusField) {
      statusField.values = ["Pendente", "Pago", "Vencido", "Cancelado"];
    }

    app.save(finance);

    // 3. Migrar registros existentes com status "Atrasado" -> "Pendente".
    //    O estado "Vencido" é derivado automaticamente da data de vencimento,
    //    então não precisamos gravar "Vencido" no banco.
    try {
      const records = app.findRecordsByFilter(
        "finance_entries",
        'status = "Atrasado"',
      );
      for (const r of records) {
        r.set("status", "Pendente");
        app.save(r);
      }
    } catch (_) {
      /* nenhum registro "Atrasado" — ok */
    }
  },
  (app) => {
    const finance = app.findCollectionByNameOrId("finance_entries");

    const dueField = finance.fields.getByName("due_date");
    if (dueField) {
      dueField.required = false;
    }

    const statusField = finance.fields.getByName("status");
    if (statusField) {
      statusField.values = ["Pendente", "Pago", "Atrasado", "Cancelado"];
    }

    app.save(finance);

    // Reverter "Pendente" derivados de "Atrasado" não é determinístico;
    // a reversão de schema acima já restaura o estado anterior das opções.
  },
);
