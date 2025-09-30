import { ItemEquipmentPhase } from './ItemEquipmentPhase';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { AccessoryCatalog } from '../items/accessory';
import { Display } from '../ui/Display';

describe('ItemEquipmentPhase synthesis UI', () => {
  const noop = () => undefined;
  let warningSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(Display, 'clear').mockImplementation(noop);
    jest.spyOn(Display, 'printHeader').mockImplementation(noop);
    jest.spyOn(Display, 'newLine').mockImplementation(noop);
    jest.spyOn(Display, 'printInfo').mockImplementation(noop);
    jest.spyOn(Display, 'println').mockImplementation(noop);
    jest.spyOn(Display, 'printSuccess').mockImplementation(noop);
    warningSpy = jest.spyOn(Display, 'printWarning').mockImplementation(noop);
    jest.spyOn(Display, 'printError').mockImplementation(noop);
    jest.spyOn(Display, 'printCommand').mockImplementation(noop);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const processKey = (phase: ItemEquipmentPhase, key: string) =>
    (phase as unknown as { processKeyInput: (input: string) => unknown }).processKeyInput(key);

  const getMode = (phase: ItemEquipmentPhase): string =>
    (phase as unknown as { mode: string }).mode;

  const getStatusMessage = (phase: ItemEquipmentPhase): { variant: string; text: string } | null =>
    (phase as unknown as { statusMessage: { variant: string; text: string } | null }).statusMessage;

  const renderPhase = (phase: ItemEquipmentPhase): void => {
    (phase as unknown as { render: () => void }).render();
  };

  it('synthesizes matching accessories and updates inventory', () => {
    const world = new World('tech-startup', 1, true);
    const player = new Player('hero');
    const catalog = AccessoryCatalog.load();

    const tempo = catalog.getSubEffect('tempo');
    const flare = catalog.getSubEffect('flare');
    const baseAccessory = catalog.createAccessory('glove', 10, [tempo]);
    const materialAccessory = catalog.createAccessory('glove', 15, [flare]);

    player.getAccessoryInventory().addItem(baseAccessory);
    player.getAccessoryInventory().addItem(materialAccessory);

    const phase = new ItemEquipmentPhase(world, player);

    expect(getMode(phase)).toBe('manage');

    processKey(phase, 's');
    expect(getMode(phase)).toBe('selectBase');

    processKey(phase, ' ');
    expect(getMode(phase)).toBe('selectMaterial');

    processKey(phase, ' ');
    expect(getMode(phase)).toBe('selectEffects');

    processKey(phase, ' ');
    processKey(phase, '\u001b[B');
    processKey(phase, ' ');

    processKey(phase, 's');
    expect(getMode(phase)).toBe('result');

    const inventoryItems = player.getAccessoryInventory().getItems();
    expect(inventoryItems).toHaveLength(1);
    const synthesized = inventoryItems[0];
    expect(synthesized.getGrade()).toBe(15);

    const subEffectNames = synthesized
      .getSubEffects()
      .map(effect => effect.name)
      .sort();
    expect(subEffectNames).toEqual(['Flare', 'Tempo']);

    expect(player.getAccessoryInventory().hasItem(baseAccessory)).toBe(false);
    expect(player.getAccessoryInventory().hasItem(materialAccessory)).toBe(false);

    processKey(phase, ' ');
    expect(getMode(phase)).toBe('manage');
  });

  it('prevents synthesis start when duplicates are missing', () => {
    const world = new World('tech-startup', 1, true);
    const player = new Player('hero');
    const catalog = AccessoryCatalog.load();

    const soloAccessory = catalog.createAccessory('glove', 10, []);
    player.getAccessoryInventory().addItem(soloAccessory);

    const phase = new ItemEquipmentPhase(world, player);
    expect(getMode(phase)).toBe('manage');

    processKey(phase, 's');

    expect(getMode(phase)).toBe('manage');
    const statusMessage = getStatusMessage(phase);
    expect(statusMessage).toEqual({
      variant: 'warning',
      text: 'synthesis requires at least two accessories sharing the same main effect',
    });

    renderPhase(phase);

    expect(warningSpy).toHaveBeenCalledWith(
      'synthesis requires at least two accessories sharing the same main effect'
    );
  });
});
