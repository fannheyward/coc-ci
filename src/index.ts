import { ExtensionContext, workspace } from 'coc.nvim';
import { enPOSTag, Segment, SegmentToken, useDefault } from 'segmentit';

const segmentit = useDefault(new Segment());

async function fallbackMove(w = true) {
  await workspace.nvim.eval(`feedkeys(${w ? '"w"' : '"b"'}, "n")`);
}

async function move(w = true) {
  const { nvim } = workspace;
  const line = await nvim.line;
  if (!line) {
    return fallbackMove(w);
  }

  const cursor = await nvim.eval('[line("."), col(".")]');
  const col = cursor[1];

  const lineBuf = new Buffer(line);
  if (col >= lineBuf.length) {
    return fallbackMove(w);
  }

  const lineBegin = lineBuf.subarray(0, col - 1).toString();
  const lineEnd = lineBuf.subarray(col - 1).toString();
  const parts = segmentit.doSegment(w ? lineEnd : lineBegin) as SegmentToken[];
  if (!parts || parts.length <= 0) {
    return fallbackMove(w);
  }

  const seg = w ? parts[0] : parts[parts.length - 1];
  if (['un', 'nx', 'w', 'uri'].includes(enPOSTag(seg.p))) {
    return fallbackMove(w);
  }

  const len = new Buffer(seg.w).length;
  await nvim.call('cursor', [cursor[0], w ? col + len : col - len]);
}

export async function activate(context: ExtensionContext): Promise<void> {
  context.subscriptions.push(
    workspace.registerKeymap(
      ['n'],
      'ci-w',
      async () => {
        await move();
      },
      { sync: false, cancel: true, silent: true }
    ),

    workspace.registerKeymap(
      ['n'],
      'ci-b',
      async () => {
        await move(false);
      },
      { sync: false, cancel: true, silent: true }
    )
  );
}
