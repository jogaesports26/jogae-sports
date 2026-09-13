import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MANAGE_KEY = 'requireManage';

/**
 * Marca um endpoint como exigindo a permissão MANAGE_RESERVATIONS quando
 * acessado por um funcionário (STAFF) — donos (COURT_OWNER) sempre passam.
 * Usar em endpoints de escrita (criar/editar/cancelar) que um funcionário
 * VIEW_ONLY não deve poder executar.
 */
export const RequireManage = () => SetMetadata(REQUIRE_MANAGE_KEY, true);
