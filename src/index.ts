import { CompleteOption, CompleteResult, ExtensionContext, sources, VimCompleteItem, workspace } from 'coc.nvim';
import { Segment, useDefault } from 'segmentit';

export async function activate(context: ExtensionContext): Promise<void> {
  const segmentit = useDefault(new Segment());

  context.subscriptions.push(
    sources.createSource({
      name: 'coc-ci', // unique id
      priority: 10,
      doComplete: async (opt: CompleteOption) => {
        const doc = workspace.getDocument(opt.bufnr);
        if (!doc || opt.input.length === 0) {
          return;
        }

        const items: VimCompleteItem[] = [];
        const lines = await doc.buffer.lines;
        lines.forEach(line => {
          if (line.trim().length > 10) {
            segmentit.doSegment(line.trim()).forEach(seg => {
              if (seg.w && seg.w.length > 2 && /^[\u4e00-\u9FA5]+$/.test(seg.w)) {
                items.push({ word: seg.w, menu: '[Ci]' });
              }
            });
          }
        });

        return new Promise<CompleteResult>(resolve => {
          resolve({ items });
        });
      }
    })
  );
}
