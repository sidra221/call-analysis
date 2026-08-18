export default function Typography(fontFamily) {
  return {
    fontFamily,
    h6: {
      fontFamily,
      fontWeight: 500,
      fontSize: '0.75rem'
    },
    h5: {
      fontFamily,
      fontSize: '0.875rem',
      fontWeight: 500
    },
    h4: {
      fontFamily,
      fontSize: '1rem',
      fontWeight: 600
    },
    h3: {
      fontFamily,
      fontSize: '1.25rem',
      fontWeight: 600
    },
    h2: {
      fontFamily,
      fontSize: '1.5rem',
      fontWeight: 700
    },
    h1: {
      fontFamily,
      fontSize: '2.125rem',
      fontWeight: 700
    },
    subtitle1: {
      fontFamily,
      fontSize: '0.875rem',
      fontWeight: 500
    },
    subtitle2: {
      fontFamily,
      fontSize: '0.75rem',
      fontWeight: 400
    },
    caption: {
      fontFamily,
      fontSize: '0.75rem',
      fontWeight: 400
    },
    body1: {
      fontFamily,
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.334em'
    },
    body2: {
      fontFamily,
      letterSpacing: '0em',
      fontWeight: 400,
      lineHeight: '1.5em'
    },
    button: {
      fontFamily,
      textTransform: 'none',
      fontWeight: 600
    },
    commonAvatar: {
      cursor: 'pointer',
      borderRadius: '8px'
    },
    smallAvatar: {
      width: '22px',
      height: '22px',
      fontSize: '1rem'
    },
    mediumAvatar: {
      width: '34px',
      height: '34px',
      fontSize: '1.2rem'
    },
    largeAvatar: {
      width: '44px',
      height: '44px',
      fontSize: '1.5rem'
    }
  };
}
