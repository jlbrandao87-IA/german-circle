export type Brand = 'Porsche' | 'Mercedes-Benz' | 'BMW' | 'Audi';
export type Horizon = 'explorar' | '0-6' | '6-12' | '12+';
export type GarageKind = 'dream' | 'owned';
export type Fuel = 'indiferente' | 'gasolina' | 'diesel' | 'hibrido' | 'eletrico';
export type GarageCar = {
  id: string; owner_id: string; kind: GarageKind; brand: Brand; model: string;
  version: string | null; year_from: number | null; budget_eur: number | null;
  horizon: Horizon; notes: string | null; priority: number; year_to: number | null; max_mileage_km: number | null; fuel: Fuel; created_at: string; updated_at: string;
};
export type NewCar = Pick<GarageCar, 'brand' | 'model' | 'version' | 'year_from' | 'budget_eur' | 'horizon' | 'notes' | 'kind' | 'priority' | 'year_to' | 'max_mileage_km' | 'fuel'>;
export const BRANDS: Brand[] = ['Porsche', 'Mercedes-Benz', 'BMW', 'Audi'];
export function validCar(car: NewCar): string | null {
  if (!BRANDS.includes(car.brand)) return 'Escolha uma das quatro marcas.';
  if (!car.model.trim() || car.model.length > 55) return 'O modelo deve ter entre 1 e 55 caracteres.';
  if (car.version && car.version.length > 80) return 'Versão demasiado longa.';
  if (car.year_from !== null && (!Number.isInteger(car.year_from) || car.year_from < 1960 || car.year_from > 2035)) return 'Ano inválido.';
  if (car.budget_eur !== null && (!Number.isFinite(car.budget_eur) || car.budget_eur < 0 || car.budget_eur > 10000000)) return 'Orçamento inválido.';
  if (!Number.isInteger(car.priority) || car.priority < 1 || car.priority > 5) return 'Prioridade inválida.';
  if (car.year_to !== null && (!Number.isInteger(car.year_to) || car.year_to < 1960 || car.year_to > 2035 || (car.year_from !== null && car.year_to < car.year_from))) return 'O ano máximo tem de ser igual ou superior ao mínimo.';
  if (car.max_mileage_km !== null && (!Number.isInteger(car.max_mileage_km) || car.max_mileage_km < 0 || car.max_mileage_km > 1000000)) return 'Quilometragem inválida.';
  if (!['indiferente','gasolina','diesel','hibrido','eletrico'].includes(car.fuel)) return 'Motorização inválida.';
  if (car.notes && car.notes.length > 500) return 'Notas demasiado longas.';
  if (!['explorar', '0-6', '6-12', '12+'].includes(car.horizon)) return 'Prazo inválido.';
  if (!['dream', 'owned'].includes(car.kind)) return 'Tipo de garagem inválido.';
  return null;
}
export const euro = (value: number) => new Intl.NumberFormat('pt-PT', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(value);
