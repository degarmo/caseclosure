// tailwind.config.js
const plugin = require("tailwindcss/plugin");
const colors = require("tailwindcss/colors");

module.exports = {
    darkMode: ["class"],
    content: [
    "./public/**/*.html",
    "./public/*.html",
    "./src/**/*.js",
    "./src/**/*.jsx",
    "./src/*.js",
    "./src/**/*.html",
    "./src/*.html",
    "./public/**/*.js",
    "./public/*.js",
  ],
  theme: {
  	colors: {
            ...colors
  	},
  	extend: {
  		minHeight: {
  			'screen-75': '75vh'
  		},
  		fontSize: {
  			'55': '55rem'
  		},
  		opacity: {
  			'80': '.8'
  		},
  		zIndex: {
  			'2': 2,
  			'3': 3
  		},
  		inset: {
  			'-100': '-100%',
  			'-225-px': '-225px',
  			'-160-px': '-160px',
  			'-150-px': '-150px',
  			'-94-px': '-94px',
  			'-50-px': '-50px',
  			'-29-px': '-29px',
  			'-20-px': '-20px',
  			'25-px': '25px',
  			'40-px': '40px',
  			'95-px': '95px',
  			'145-px': '145px',
  			'195-px': '195px',
  			'210-px': '210px',
  			'260-px': '260px'
  		},
  		height: {
  			'95-px': '95px',
  			'70-px': '70px',
  			'350-px': '350px',
  			'500-px': '500px',
  			'600-px': '600px'
  		},
  		maxHeight: {
  			'860-px': '860px'
  		},
  		maxWidth: {
  			'100-px': '100px',
  			'120-px': '120px',
  			'150-px': '150px',
  			'180-px': '180px',
  			'200-px': '200px',
  			'210-px': '210px',
  			'580-px': '580px'
  		},
  		minWidth: {
  			'48': '12rem',
  			'140-px': '140px'
  		},
  		backgroundSize: {
  			full: '100%'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  variants: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"),
    plugin(function ({ addComponents, theme }) {
      const screens = theme("screens", {});
      addComponents([
        { ".container": { width: "100%" } },
        { [`@media (min-width: ${screens.sm})`]: { ".container": { "max-width": "640px" } } },
        { [`@media (min-width: ${screens.md})`]: { ".container": { "max-width": "768px" } } },
        { [`@media (min-width: ${screens.lg})`]: { ".container": { "max-width": "1024px" } } },
        { [`@media (min-width: ${screens.xl})`]: { ".container": { "max-width": "1280px" } } },
        { [`@media (min-width: ${screens["2xl"]})`]: { ".container": { "max-width": "1280px" } } },
      ]);
    }),
      require("tailwindcss-animate")
],
};
