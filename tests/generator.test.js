// tests/generator.test.js
import { generateMap } from '../src/map/generator.js';

describe('generateMap', () => {
  it('produces between 20 and 35 neurons', () => {
    const map = generateMap(42);
    expect(map.neurons.length).toBeGreaterThanOrEqual(20);
    expect(map.neurons.length).toBeLessThanOrEqual(35);
  });

  it('graph is connected — every neuron reachable from first', () => {
    const map = generateMap(7);
    const adj = new Map(map.neurons.map(n => [n.id, []]));
    map.synapses.forEach(s => {
      adj.get(s.nodeA).push(s.nodeB);
      adj.get(s.nodeB).push(s.nodeA);
    });
    const visited = new Set();
    const queue = [map.neurons[0].id];
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      adj.get(id).forEach(nb => queue.push(nb));
    }
    expect(visited.size).toBe(map.neurons.length);
  });

  it('same seed produces identical maps', () => {
    const a = generateMap(123);
    const b = generateMap(123);
    expect(a.neurons.length).toBe(b.neurons.length);
    expect(a.neurons[0].center).toEqual(b.neurons[0].center);
  });

  it('different seeds produce different maps', () => {
    const a = generateMap(1);
    const b = generateMap(2);
    expect(a.neurons[0].center).not.toEqual(b.neurons[0].center);
  });
});
