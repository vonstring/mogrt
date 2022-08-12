import {Mogrt} from '../mogrt';
import path from 'path';
import { fileURLToPath } from 'url';
import { temporaryDirectoryTask } from 'tempy';
import fs from 'node:fs';

import { notDeepEqual } from 'assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AFTEREFFECTS_MOGRT_FILE = path.join(__dirname, 'assets/ae.mogrt');
const PREMIERE_MOGRT_FILE = path.join(__dirname, 'assets/premiere.mogrt');

describe('after effects template', () => {
    let mogrt;
    beforeEach(() => {
        mogrt = new Mogrt(AFTEREFFECTS_MOGRT_FILE);
    })
    test('loads after effects .mogrt', async () => {
        await mogrt.init();
        const manifest = await mogrt.getManifest();
    
        expect(typeof manifest).toBe('object'); 
        expect(manifest).toHaveProperty('authorApp', 'aefx');
        expect(mogrt.isAfterEffects()).toBe(true);
        expect(mogrt.isPremiere()).toBe(false);
    });

    test('throws when accessing uninitialized manifest', async () => {
        expect(mogrt.initialized).toBe(false);
        expect(() => {mogrt.isAfterEffects()}).toThrow(Error);
        expect(() => {mogrt.isPremiere()}).toThrow(Error);
        expect(() => {mogrt.getEssentialFields()}).toThrow(Error);
        await mogrt.init();
        expect(mogrt.isAfterEffects()).toBe(true);
    });

    test('adobe style strings are flattened by default', async () => {
        await mogrt.init();
        const manifest = await mogrt.getManifest();
        expect(manifest.capsuleNameLocalized).not.toHaveProperty('strDB');
    });

    test('adobe style strings are not flattened if asked not to', async () => {
        await mogrt.init();
        const manifest = await mogrt.getManifest(false);
        expect(manifest.capsuleNameLocalized).toHaveProperty('strDB');
    });

    test('extracts file', async () => {
        await mogrt.init();
        let filenames;
        await temporaryDirectoryTask(async tmpPath => {
            filenames = await mogrt.extractTo(tmpPath);
            expect(fs.existsSync(path.join(tmpPath, 'test.aep'))).toBe(true);
        });
        expect(filenames).toHaveLength(2);
    })

    test('extracts Essential Graphics fields', async () => {
        await mogrt.init();
        const fields = mogrt.getEssentialFields();
        expect(fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    "canAnimate":true,
                })
            ])
        );
        expect(fields).toHaveLength(9);
    });

    test('extracts Essential Graphics fields unflattened', async () => {
        await mogrt.init();
        const fields = mogrt.getEssentialFields(false);
        expect(fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    "uiName":expect.objectContaining({
                        "strDB":expect.any(Array)
                    }),
                })
            ])
        );
    })
});

test('loads premiere .mogrt', async () => {
    const mogrt = new Mogrt(PREMIERE_MOGRT_FILE);
    await mogrt.init();
    const manifest = await mogrt.getManifest();
    
    expect(typeof manifest).toBe('object'); 
    expect(manifest).toHaveProperty('authorApp', 'ppro');
    expect(mogrt.isAfterEffects()).toBe(false);
    expect(mogrt.isPremiere()).toBe(true);
});