import { Fragment, useState } from 'react';
import { Link, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';

// Gemini kadang membalas dengan markdown sederhana: **tebal**, *miring*, dan butir "* ".
const BULLET = /^\s*(?:[*\-•]|\d+\.)\s+/;
const COLLAPSE_AT = 420;

export function stripMarkdown(text = '') {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$|[.,:;!?])/g, '$1$2')
    .replace(/^\s*[*\-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderInline(text) {
  return text.split(/(\*\*.+?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part.replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$|[.,:;!?])/g, '$1$2')}</Fragment>
    ),
  );
}

function toBlocks(text) {
  const blocks = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '');
      const last = blocks[blocks.length - 1];
      if (last?.type === 'list') last.items.push(item);
      else blocks.push({ type: 'list', items: [item] });
    } else {
      blocks.push({ type: 'p', text: line });
    }
  }
  return blocks;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('8px'),
    maxWidth: '70ch',
    lineHeight: tokens.lineHeightBase400,
    '& p, & ul': { ...shorthands.margin(0) },
    '& ul': { paddingLeft: '18px', display: 'grid', ...shorthands.gap('4px') },
    '& strong': { fontWeight: tokens.fontWeightSemibold },
  },
  collapsed: {
    maxHeight: '13.5em',
    ...shorthands.overflow('hidden'),
    maskImage: 'linear-gradient(to bottom, black 70%, transparent)',
  },
  toggle: { justifySelf: 'start' },
});

export default function AiNoteText({ text }) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const long = text.length > COLLAPSE_AT;

  return (
    <>
      <div className={mergeClasses(styles.root, long && !expanded && styles.collapsed)}>
        {toBlocks(text).map((block, i) =>
          block.type === 'list' ? (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{renderInline(block.text)}</p>
          ),
        )}
      </div>
      {long && (
        <Link as="button" className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Tampilkan lebih sedikit' : 'Tampilkan selengkapnya'}
        </Link>
      )}
    </>
  );
}
