type TemplateVars = {
  event_name: string;
  company_name: string | null;
  third_party_name: string | null;
  event_date: string;
  risk_clause: string | null;
  includes_minors: boolean;
};

function buildParties(vars: TemplateVars): string[] {
  return [vars.company_name, vars.third_party_name].filter(
    (v): v is string => !!v && v.trim().length > 0,
  );
}

// Describes why the event exists: commissioned by a paying client
// (company_name) and/or run alongside an external co-facilitator
// (third_party_name). These are different relationships, so they get
// different connectors instead of being lumped into one "en conjunto con"
// list — a client isn't a co-organizer.
function organizerClause(vars: TemplateVars): string {
  const parts: string[] = [];
  if (vars.company_name?.trim()) parts.push(`a solicitud de ${vars.company_name.trim()}`);
  if (vars.third_party_name?.trim()) parts.push(`en conjunto con ${vars.third_party_name.trim()}`);
  if (parts.length === 0) return "";
  return ` ${parts.join(", ")}`;
}

// Used where the client/third party need to be listed as additional
// protected parties (liability release, photo authorization) rather than
// described by their relationship to the event.
function releasedPartiesClause(parties: string[]): string {
  if (parties.length === 0) return "";
  if (parties.length === 1) return ` y ${parties[0]}`;
  return ` y ${parties[0]} y ${parties[1]}`;
}

function companyLine(parties: string[]): string {
  if (parties.length === 0) return "";
  return ` — ${parties.join(" / ")}`;
}

function riskClauseBlock(riskClause: string | null): string {
  if (!riskClause || !riskClause.trim()) return "";
  return `**Riesgos específicos de esta actividad:** ${riskClause.trim()}\n`;
}

function minorsBlock(includesMinors: boolean): string {
  if (!includesMinors) return "";
  return (
    "### 7. Menores de edad\n\n" +
    "Si algún participante es menor de 18 años, este Relevo debe ser firmado por su padre, madre o tutor legal, quien asume en su representación los términos aquí establecidos.\n"
  );
}

export function renderWaiverText(template: string, vars: TemplateVars): string {
  const parties = buildParties(vars);

  return template
    .replaceAll("{{event_name}}", vars.event_name)
    .replaceAll("{{event_date}}", vars.event_date)
    .replaceAll("{{organizer_clause}}", organizerClause(vars))
    .replaceAll("{{released_parties_clause}}", releasedPartiesClause(parties))
    .replaceAll("{{company_line}}", companyLine(parties))
    .replaceAll("{{risk_clause_block}}", riskClauseBlock(vars.risk_clause))
    .replaceAll("{{minors_block}}", minorsBlock(vars.includes_minors));
}
