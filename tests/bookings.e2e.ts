import { test, expect } from 'e2e';

async function enter(screen: any, title: string, start = '10:00', end = '11:00') {
  await screen.getByLabel('Nombre de la reserva').fill(title);
  await screen.getByLabel('Fecha de la reserva').fill('2030-06-12');
  await screen.getByLabel('Hora de inicio').fill(start);
  await screen.getByLabel('Hora de fin').fill(end);
  await screen.getByRole('button', 'Confirmar reserva').tap();
}
test.describe('reservas', { tags: ['reservas'] }, () => {
  test.beforeEach(async ({app, screen}) => {
    await app.open('/reservas');
    await expect(screen.getByTestId('booking')).toHaveCount(0);
  });
  test('creates a valid booking', async ({screen}) => {
    await enter(screen,'Planificación');
    await expect(screen.getByTestId('booking')).toHaveCount(1);
    await expect(screen.getByTestId('booking').first()).toContainText('Planificación');
    await expect(screen.getByTestId('booking').first()).toContainText('Sala Atlas');
    await expect(screen.getByRole('status','Resultado')).toHaveText('Reserva confirmada.');
  });
  test('rejects an invalid interval', async ({screen}) => {
    await enter(screen,'Intervalo inválido','12:00','11:00');
    await expect(screen.getByTestId('booking')).toHaveCount(0);
    await expect(screen.getByRole('status','Resultado')).toHaveText('La hora de fin debe ser posterior al inicio.');
  });
  test('rejects overlapping bookings', async ({screen}) => {
    await enter(screen,'Primera'); await enter(screen,'Conflicto','10:30','11:30');
    await expect(screen.getByTestId('booking')).toHaveCount(1);
    await expect(screen.getByTestId('booking').first()).toContainText('Primera');
    await expect(screen.getByRole('status','Resultado')).toHaveText('La sala ya está reservada en ese horario.');
  });
  test('allows adjacent intervals', async ({screen}) => {
    await enter(screen,'Primera'); await enter(screen,'Siguiente','11:00','12:00');
    await expect(screen.getByTestId('booking')).toHaveCount(2);
    await expect(screen.getByRole('status','Resultado')).toHaveText('Reserva confirmada.');
  });
  test('allows simultaneous bookings in different rooms', async ({screen}) => {
    await enter(screen,'Atlas'); await screen.getByLabel('Sala Luna').check(); await enter(screen,'Luna');
    await expect(screen.getByTestId('booking')).toHaveCount(2);
    await expect(screen.getByTestId('booking').last()).toContainText('Sala Luna');
  });
  test('cancellation releases the interval', async ({screen}) => {
    await enter(screen,'Cancelar'); await screen.getByRole('button','Cancelar Cancelar').tap();
    await expect(screen.getByTestId('booking')).toHaveCount(0);
    await enter(screen,'Reemplazo');
    await expect(screen.getByTestId('booking')).toHaveCount(1);
    await expect(screen.getByTestId('booking').first()).toContainText('Reemplazo');
  });
  test('persists bookings across reload', async ({app,screen}) => {
    await enter(screen,'Persistente'); await app.open('/reservas');
    await expect(screen.getByTestId('booking')).toHaveCount(1);
    await expect(screen.getByTestId('booking').first()).toContainText('Persistente');
    await app.restart(); await app.open('/reservas');
    await expect(screen.getByTestId('booking')).toHaveCount(1);
    await expect(screen.getByTestId('booking').first()).toContainText('Persistente');
  });
});
