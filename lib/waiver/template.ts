type TemplateVars = {
  event_name: string;
  company_name: string | null;
  third_party_name: string | null;
  event_date: string;
};

function buildParties(vars: TemplateVars): string[] {
  return [vars.company_name, vars.third_party_name].filter(
    (v): v is string => !!v && v.trim().length > 0,
  );
}

function partiesClause(parties: string[]): string {
  if (parties.length === 0) return "";
  if (parties.length === 1) return ` en conjunto con ${parties[0]}`;
  return ` en conjunto con ${parties[0]} y ${parties[1]}`;
}

function companyLine(parties: string[]): string {
  if (parties.length === 0) return "";
  return ` — ${parties.join(" / ")}`;
}

export function renderWaiverText(template: string, vars: TemplateVars): string {
  const parties = buildParties(vars);

  return template
    .replaceAll("{{event_name}}", vars.event_name)
    .replaceAll("{{event_date}}", vars.event_date)
    .replaceAll("{{parties_clause}}", partiesClause(parties))
    .replaceAll("{{company_line}}", companyLine(parties));
}
