/* ---------- world, simulation and rendering ---------- */
const cv = $('cv'), ctx = cv.getContext('2d', { alpha: false });
let W = 0, H = 0, DPR = 1, HZ = 0, PY = 0, RW = 0, ZB = -0.05, bg = null, vpx = 0;
let LOW = store.get('low', false) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
let Q = 2; // auto quality 2..0
const STEP = 1 / 120, BOLT_V = 2.0;
let KPv = 5, CUR = 0, ridge = null;
const LOGO_D = 'M-0.001,-0.239L-0.025,-0.211L-0.027,-0.206L-0.040,-0.188L-0.043,-0.182L-0.047,-0.178L-0.052,-0.168L-0.056,-0.164L-0.060,-0.155L-0.064,-0.149L-0.065,-0.144L-0.072,-0.134L-0.074,-0.126L-0.080,-0.117L-0.082,-0.109L-0.087,-0.102L-0.088,-0.091L-0.095,-0.077L-0.096,-0.067L-0.104,-0.042L-0.104,-0.034L-0.109,-0.008L-0.110,0.026L-0.109,0.027L-0.108,0.046L-0.104,0.064L-0.103,0.079L-0.096,0.098L-0.095,0.108L-0.089,0.120L-0.087,0.133L-0.084,0.136L-0.081,0.142L-0.080,0.149L-0.075,0.156L-0.073,0.163L-0.067,0.171L-0.063,0.182L-0.058,0.189L-0.056,0.195L-0.051,0.201L-0.048,0.208L-0.044,0.212L-0.041,0.218L-0.011,0.260L-0.001,0.270L0.006,0.269L0.017,0.257L0.018,0.254L0.034,0.235L0.042,0.220L0.048,0.213L0.050,0.209L0.056,0.202L0.057,0.197L0.063,0.188L0.065,0.182L0.070,0.176L0.073,0.167L0.078,0.161L0.080,0.153L0.087,0.141L0.089,0.130L0.095,0.118L0.095,0.113L0.098,0.105L0.102,0.097L0.104,0.082L0.110,0.062L0.113,0.011L0.112,0.010L0.112,-0.009L0.111,-0.010L0.110,-0.031L0.104,-0.051L0.102,-0.065L0.095,-0.083L0.094,-0.090L0.088,-0.101L0.087,-0.111L0.080,-0.121L0.079,-0.128L0.074,-0.135L0.072,-0.141L0.065,-0.151L0.062,-0.159L0.057,-0.166L0.055,-0.172L0.041,-0.190L0.040,-0.194L0.011,-0.233L0.005,-0.238ZM-0.001,-0.998L-0.015,-0.986L-0.031,-0.975L-0.090,-0.923L-0.141,-0.872L-0.144,-0.867L-0.157,-0.855L-0.186,-0.821L-0.233,-0.759L-0.236,-0.752L-0.240,-0.747L-0.242,-0.742L-0.250,-0.733L-0.251,-0.729L-0.255,-0.725L-0.260,-0.715L-0.263,-0.712L-0.266,-0.704L-0.273,-0.695L-0.275,-0.689L-0.286,-0.673L-0.290,-0.662L-0.295,-0.656L-0.297,-0.649L-0.303,-0.641L-0.304,-0.636L-0.310,-0.627L-0.312,-0.617L-0.326,-0.591L-0.328,-0.583L-0.334,-0.573L-0.337,-0.562L-0.341,-0.554L-0.343,-0.544L-0.349,-0.534L-0.351,-0.523L-0.355,-0.517L-0.359,-0.500L-0.364,-0.487L-0.366,-0.475L-0.372,-0.462L-0.374,-0.447L-0.380,-0.433L-0.382,-0.416L-0.388,-0.398L-0.388,-0.385L-0.395,-0.357L-0.397,-0.332L-0.402,-0.309L-0.403,-0.289L-0.404,-0.288L-0.404,-0.271L-0.405,-0.270L-0.407,-0.224L-0.408,-0.223L-0.408,-0.192L-0.409,-0.191L-0.408,-0.188L-0.408,-0.159L-0.407,-0.158L-0.407,-0.142L-0.406,-0.141L-0.405,-0.110L-0.404,-0.109L-0.404,-0.090L-0.400,-0.060L-0.397,-0.048L-0.395,-0.021L-0.390,-0.003L-0.388,0.021L-0.381,0.045L-0.379,0.061L-0.374,0.073L-0.371,0.091L-0.367,0.099L-0.364,0.115L-0.359,0.129L-0.357,0.140L-0.351,0.153L-0.348,0.166L-0.343,0.176L-0.341,0.187L-0.336,0.197L-0.333,0.210L-0.330,0.212L-0.327,0.219L-0.326,0.226L-0.319,0.238L-0.318,0.250L-0.322,0.254L-0.328,0.256L-0.334,0.261L-0.343,0.264L-0.349,0.269L-0.354,0.270L-0.362,0.276L-0.368,0.278L-0.374,0.283L-0.384,0.287L-0.388,0.290L-0.397,0.293L-0.404,0.298L-0.415,0.303L-0.418,0.306L-0.427,0.309L-0.434,0.313L-0.446,0.318L-0.451,0.322L-0.459,0.324L-0.469,0.331L-0.475,0.332L-0.487,0.338L-0.492,0.339L-0.500,0.343L-0.508,0.350L-0.508,0.994L-0.503,0.997L-0.499,0.996L-0.491,0.991L-0.486,0.990L-0.475,0.985L-0.463,0.982L-0.459,0.978L-0.447,0.975L-0.438,0.969L-0.426,0.966L-0.421,0.963L-0.411,0.960L-0.399,0.953L-0.395,0.953L-0.387,0.947L-0.380,0.945L-0.369,0.938L-0.363,0.938L-0.355,0.932L-0.345,0.928L-0.340,0.924L-0.330,0.920L-0.322,0.914L-0.317,0.913L-0.312,0.909L-0.302,0.905L-0.299,0.902L-0.288,0.897L-0.283,0.892L-0.278,0.891L-0.269,0.885L-0.263,0.883L-0.258,0.878L-0.249,0.874L-0.245,0.870L-0.239,0.868L-0.230,0.861L-0.224,0.859L-0.220,0.855L-0.212,0.851L-0.208,0.846L-0.202,0.844L-0.183,0.830L-0.179,0.829L-0.174,0.824L-0.165,0.819L-0.162,0.815L-0.157,0.813L-0.152,0.809L-0.146,0.806L-0.131,0.793L-0.113,0.782L-0.100,0.770L-0.094,0.767L-0.068,0.745L-0.056,0.737L-0.015,0.700L-0.011,0.697L-0.002,0.688L0.001,0.688L0.008,0.690L0.022,0.705L0.026,0.707L0.070,0.745L0.082,0.753L0.107,0.774L0.113,0.777L0.117,0.782L0.170,0.820L0.175,0.822L0.194,0.837L0.198,0.838L0.217,0.852L0.223,0.854L0.230,0.860L0.237,0.863L0.240,0.866L0.249,0.870L0.255,0.875L0.259,0.876L0.267,0.883L0.273,0.885L0.293,0.898L0.300,0.900L0.307,0.906L0.315,0.909L0.323,0.914L0.329,0.916L0.336,0.921L0.344,0.924L0.347,0.927L0.359,0.932L0.365,0.937L0.374,0.939L0.379,0.943L0.388,0.946L0.393,0.950L0.405,0.954L0.416,0.961L0.423,0.962L0.432,0.967L0.441,0.969L0.451,0.975L0.461,0.977L0.470,0.983L0.479,0.985L0.488,0.990L0.498,0.992L0.507,0.998L0.510,0.997L0.512,0.993L0.512,0.809L0.511,0.808L0.511,0.354L0.512,0.352L0.510,0.347L0.498,0.340L0.487,0.338L0.481,0.333L0.473,0.331L0.464,0.325L0.457,0.323L0.443,0.315L0.437,0.313L0.430,0.309L0.423,0.307L0.415,0.301L0.407,0.298L0.404,0.295L0.392,0.290L0.386,0.286L0.379,0.284L0.373,0.279L0.351,0.268L0.345,0.263L0.338,0.262L0.330,0.255L0.323,0.253L0.321,0.250L0.321,0.243L0.333,0.218L0.336,0.207L0.341,0.195L0.342,0.188L0.348,0.178L0.350,0.167L0.356,0.156L0.357,0.147L0.362,0.134L0.365,0.119L0.371,0.105L0.373,0.090L0.379,0.076L0.381,0.060L0.387,0.043L0.388,0.025L0.394,0.005L0.396,-0.017L0.402,-0.042L0.404,-0.073L0.410,-0.113L0.411,-0.247L0.410,-0.248L0.409,-0.276L0.404,-0.307L0.402,-0.336L0.396,-0.361L0.394,-0.382L0.388,-0.407L0.387,-0.418L0.380,-0.439L0.379,-0.450L0.372,-0.467L0.372,-0.473L0.365,-0.490L0.363,-0.502L0.358,-0.513L0.356,-0.525L0.349,-0.538L0.348,-0.546L0.341,-0.559L0.340,-0.565L0.335,-0.575L0.332,-0.587L0.328,-0.591L0.325,-0.601L0.319,-0.611L0.317,-0.618L0.312,-0.627L0.310,-0.634L0.295,-0.660L0.294,-0.664L0.289,-0.670L0.286,-0.680L0.281,-0.686L0.278,-0.693L0.274,-0.697L0.271,-0.705L0.265,-0.712L0.263,-0.717L0.260,-0.721L0.255,-0.731L0.249,-0.738L0.248,-0.741L0.235,-0.759L0.231,-0.766L0.218,-0.782L0.210,-0.795L0.188,-0.821L0.179,-0.834L0.124,-0.893L0.087,-0.929L0.052,-0.961L0.039,-0.969L0.013,-0.991L0.003,-0.998ZM0.262,0.366L0.268,0.366L0.274,0.368L0.280,0.373L0.304,0.385L0.308,0.388L0.318,0.392L0.324,0.397L0.334,0.401L0.338,0.405L0.345,0.407L0.354,0.412L0.361,0.414L0.369,0.420L0.378,0.423L0.384,0.429L0.386,0.435L0.385,0.441L0.385,0.790L0.386,0.794L0.383,0.798L0.380,0.799L0.363,0.791L0.343,0.778L0.338,0.776L0.329,0.769L0.323,0.767L0.319,0.763L0.312,0.761L0.306,0.755L0.300,0.753L0.282,0.739L0.278,0.738L0.259,0.724L0.252,0.721L0.237,0.709L0.232,0.707L0.170,0.661L0.137,0.632L0.123,0.622L0.095,0.596L0.095,0.593L0.099,0.588L0.140,0.541L0.150,0.527L0.172,0.501L0.181,0.487L0.194,0.471L0.196,0.466L0.210,0.449L0.212,0.442L0.217,0.438L0.219,0.433L0.225,0.426L0.228,0.419L0.232,0.415L0.235,0.409L0.240,0.402L0.242,0.396L0.249,0.388L0.258,0.370ZM-0.263,0.364L-0.260,0.365L-0.252,0.374L-0.250,0.380L-0.243,0.388L-0.241,0.394L-0.228,0.413L-0.227,0.417L-0.221,0.424L-0.217,0.432L-0.204,0.450L-0.202,0.455L-0.197,0.460L-0.195,0.464L-0.182,0.481L-0.180,0.486L-0.159,0.512L-0.149,0.526L-0.121,0.558L-0.109,0.574L-0.096,0.587L-0.091,0.594L-0.091,0.597L-0.147,0.645L-0.163,0.657L-0.188,0.677L-0.201,0.686L-0.217,0.699L-0.222,0.701L-0.227,0.706L-0.233,0.709L-0.237,0.713L-0.245,0.717L-0.259,0.728L-0.266,0.732L-0.270,0.736L-0.278,0.739L-0.285,0.745L-0.291,0.748L-0.295,0.752L-0.300,0.754L-0.309,0.761L-0.314,0.762L-0.318,0.766L-0.330,0.772L-0.334,0.776L-0.339,0.778L-0.347,0.784L-0.353,0.786L-0.359,0.790L-0.366,0.793L-0.373,0.799L-0.378,0.800L-0.382,0.796L-0.382,0.433L-0.380,0.428L-0.374,0.423L-0.367,0.421L-0.361,0.416L-0.352,0.413L-0.345,0.409L-0.333,0.404L-0.329,0.400L-0.324,0.399L-0.314,0.392L-0.306,0.389L-0.300,0.385L-0.290,0.381L-0.286,0.377L-0.278,0.374L-0.275,0.371ZM-0.001,-0.829L0.003,-0.829L0.008,-0.826L0.026,-0.810L0.066,-0.769L0.104,-0.727L0.150,-0.665L0.151,-0.662L0.157,-0.655L0.159,-0.650L0.164,-0.643L0.166,-0.637L0.172,-0.631L0.176,-0.622L0.180,-0.618L0.182,-0.612L0.188,-0.605L0.190,-0.596L0.195,-0.590L0.197,-0.584L0.203,-0.576L0.205,-0.568L0.212,-0.558L0.212,-0.552L0.219,-0.541L0.220,-0.535L0.226,-0.526L0.229,-0.513L0.234,-0.506L0.236,-0.496L0.241,-0.486L0.243,-0.474L0.249,-0.463L0.252,-0.447L0.258,-0.434L0.259,-0.422L0.265,-0.403L0.266,-0.390L0.272,-0.372L0.274,-0.351L0.280,-0.325L0.282,-0.291L0.287,-0.248L0.287,-0.221L0.287,-0.220L0.287,-0.188L0.287,-0.187L0.286,-0.149L0.282,-0.117L0.280,-0.082L0.274,-0.052L0.272,-0.029L0.266,-0.008L0.264,0.011L0.259,0.028L0.258,0.039L0.251,0.059L0.249,0.072L0.244,0.082L0.242,0.094L0.237,0.107L0.235,0.117L0.229,0.130L0.226,0.142L0.220,0.153L0.218,0.163L0.214,0.168L0.210,0.184L0.205,0.191L0.202,0.202L0.197,0.209L0.195,0.216L0.189,0.226L0.187,0.235L0.181,0.243L0.179,0.250L0.173,0.259L0.171,0.265L0.165,0.273L0.164,0.278L0.160,0.284L0.156,0.293L0.152,0.297L0.148,0.307L0.136,0.325L0.134,0.331L0.119,0.351L0.117,0.357L0.106,0.371L0.095,0.388L0.082,0.405L0.080,0.410L0.051,0.445L0.050,0.448L0.011,0.494L0.004,0.500L-0.001,0.500L-0.007,0.494L-0.059,0.433L-0.067,0.419L-0.082,0.402L-0.084,0.397L-0.088,0.392L-0.099,0.376L-0.104,0.371L-0.106,0.365L-0.111,0.361L-0.114,0.353L-0.119,0.348L-0.121,0.342L-0.128,0.334L-0.129,0.330L-0.135,0.323L-0.137,0.317L-0.142,0.311L-0.144,0.304L-0.150,0.297L-0.152,0.290L-0.156,0.287L-0.177,0.244L-0.180,0.241L-0.183,0.232L-0.188,0.223L-0.190,0.215L-0.195,0.209L-0.198,0.198L-0.204,0.188L-0.206,0.180L-0.212,0.170L-0.213,0.161L-0.219,0.150L-0.222,0.138L-0.227,0.130L-0.229,0.118L-0.234,0.110L-0.237,0.095L-0.241,0.085L-0.244,0.069L-0.250,0.055L-0.253,0.037L-0.258,0.024L-0.260,0.007L-0.265,-0.013L-0.267,-0.034L-0.273,-0.059L-0.276,-0.096L-0.280,-0.117L-0.281,-0.143L-0.282,-0.144L-0.282,-0.180L-0.283,-0.181L-0.282,-0.266L-0.272,-0.350L-0.267,-0.367L-0.265,-0.387L-0.260,-0.404L-0.258,-0.419L-0.252,-0.434L-0.250,-0.447L-0.244,-0.460L-0.242,-0.472L-0.237,-0.483L-0.235,-0.493L-0.231,-0.499L-0.227,-0.513L-0.221,-0.523L-0.219,-0.533L-0.215,-0.537L-0.212,-0.550L-0.208,-0.555L-0.205,-0.561L-0.205,-0.563L-0.197,-0.576L-0.197,-0.579L-0.189,-0.591L-0.189,-0.594L-0.184,-0.602L-0.180,-0.612L-0.176,-0.615L-0.173,-0.623L-0.168,-0.629L-0.165,-0.636L-0.159,-0.644L-0.157,-0.649L-0.153,-0.653L-0.149,-0.661L-0.143,-0.667L-0.142,-0.671L-0.138,-0.676L-0.136,-0.681L-0.121,-0.698L-0.119,-0.703L-0.113,-0.709L-0.112,-0.713L-0.076,-0.755L-0.034,-0.799Z';
const LOGO_HULL = 'M-0.001,-0.829L0.003,-0.829L0.008,-0.826L0.026,-0.810L0.066,-0.769L0.104,-0.727L0.150,-0.665L0.151,-0.662L0.157,-0.655L0.159,-0.650L0.164,-0.643L0.166,-0.637L0.172,-0.631L0.176,-0.622L0.180,-0.618L0.182,-0.612L0.188,-0.605L0.190,-0.596L0.195,-0.590L0.197,-0.584L0.203,-0.576L0.205,-0.568L0.212,-0.558L0.212,-0.552L0.219,-0.541L0.220,-0.535L0.226,-0.526L0.229,-0.513L0.234,-0.506L0.236,-0.496L0.241,-0.486L0.243,-0.474L0.249,-0.463L0.252,-0.447L0.258,-0.434L0.259,-0.422L0.265,-0.403L0.266,-0.390L0.272,-0.372L0.274,-0.351L0.280,-0.325L0.282,-0.291L0.287,-0.248L0.287,-0.221L0.287,-0.220L0.287,-0.188L0.287,-0.187L0.286,-0.149L0.282,-0.117L0.280,-0.082L0.274,-0.052L0.272,-0.029L0.266,-0.008L0.264,0.011L0.259,0.028L0.258,0.039L0.251,0.059L0.249,0.072L0.244,0.082L0.242,0.094L0.237,0.107L0.235,0.117L0.229,0.130L0.226,0.142L0.220,0.153L0.218,0.163L0.214,0.168L0.210,0.184L0.205,0.191L0.202,0.202L0.197,0.209L0.195,0.216L0.189,0.226L0.187,0.235L0.181,0.243L0.179,0.250L0.173,0.259L0.171,0.265L0.165,0.273L0.164,0.278L0.160,0.284L0.156,0.293L0.152,0.297L0.148,0.307L0.136,0.325L0.134,0.331L0.119,0.351L0.117,0.357L0.106,0.371L0.095,0.388L0.082,0.405L0.080,0.410L0.051,0.445L0.050,0.448L0.011,0.494L0.004,0.500L-0.001,0.500L-0.007,0.494L-0.059,0.433L-0.067,0.419L-0.082,0.402L-0.084,0.397L-0.088,0.392L-0.099,0.376L-0.104,0.371L-0.106,0.365L-0.111,0.361L-0.114,0.353L-0.119,0.348L-0.121,0.342L-0.128,0.334L-0.129,0.330L-0.135,0.323L-0.137,0.317L-0.142,0.311L-0.144,0.304L-0.150,0.297L-0.152,0.290L-0.156,0.287L-0.177,0.244L-0.180,0.241L-0.183,0.232L-0.188,0.223L-0.190,0.215L-0.195,0.209L-0.198,0.198L-0.204,0.188L-0.206,0.180L-0.212,0.170L-0.213,0.161L-0.219,0.150L-0.222,0.138L-0.227,0.130L-0.229,0.118L-0.234,0.110L-0.237,0.095L-0.241,0.085L-0.244,0.069L-0.250,0.055L-0.253,0.037L-0.258,0.024L-0.260,0.007L-0.265,-0.013L-0.267,-0.034L-0.273,-0.059L-0.276,-0.096L-0.280,-0.117L-0.281,-0.143L-0.282,-0.144L-0.282,-0.180L-0.283,-0.181L-0.282,-0.266L-0.272,-0.350L-0.267,-0.367L-0.265,-0.387L-0.260,-0.404L-0.258,-0.419L-0.252,-0.434L-0.250,-0.447L-0.244,-0.460L-0.242,-0.472L-0.237,-0.483L-0.235,-0.493L-0.231,-0.499L-0.227,-0.513L-0.221,-0.523L-0.219,-0.533L-0.215,-0.537L-0.212,-0.550L-0.208,-0.555L-0.205,-0.561L-0.205,-0.563L-0.197,-0.576L-0.197,-0.579L-0.189,-0.591L-0.189,-0.594L-0.184,-0.602L-0.180,-0.612L-0.176,-0.615L-0.173,-0.623L-0.168,-0.629L-0.165,-0.636L-0.159,-0.644L-0.157,-0.649L-0.153,-0.653L-0.149,-0.661L-0.143,-0.667L-0.142,-0.671L-0.138,-0.676L-0.136,-0.681L-0.121,-0.698L-0.119,-0.703L-0.113,-0.709L-0.112,-0.713L-0.076,-0.755L-0.034,-0.799Z';
const ship = { x: 0, tx: 0, bank: 0, px: 0 };
const keys = { l: 0, r: 0 };
const G = { state: 'load', now: 0, ents: [], bolts: [], beams: [], parts: [], pops: [], stars: [], scroll: 0, shake: 0, freeze: 0, warp: 0, speed: 1, bot: false };
const COL = { cyan: '#3FE0FF', amber: '#FFB238', pink: '#FF4D8D', violet: '#7A5AF8', white: '#FFFFFF', lilac: '#BCACFF' };
const glowS = {};

function mkGlow(c) {
  const s = document.createElement('canvas'); s.width = s.height = 64; const g = s.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, c); r.addColorStop(0.35, c + '88'); r.addColorStop(1, c + '00');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s;
}
for (const k in COL) glowS[COL[k]] = mkGlow(COL[k]);
function glow(c, x, y, r, a) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a == null ? 1 : a; ctx.drawImage(glowS[c], x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }

function resize() {
  const st = $('stage'); W = st.clientWidth; H = st.clientHeight; if (!W || !H) return;
  DPR = Math.min(window.devicePixelRatio || 1, Q >= 2 ? 2 : Q === 1 ? 1.5 : 1);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  HZ = H * 0.2; PY = H * 0.76; RW = Math.min(W * 0.42, 230); ZB = (1 / ((H - HZ) / (PY - HZ)) - 1) / KPv;
  bg = document.createElement('canvas'); bg.width = Math.round((W + 40) * DPR / 2); bg.height = Math.round(H * DPR / 2);
  const g = bg.getContext('2d'); g.scale(bg.width / (W + 40), bg.height / H);
  let gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#05041A'); gr.addColorStop(0.2, '#1B0F52'); gr.addColorStop(0.24, '#2A1470'); gr.addColorStop(0.5, '#0D0A26'); gr.addColorStop(1, '#06051A');
  g.fillStyle = gr; g.fillRect(0, 0, W + 40, H);
  const blob = (x, y, r, c) => { const b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, c); b.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2); };
  blob(W * 0.2, H * 0.1, W * 0.6, 'rgba(98,47,238,.35)'); blob(W * 0.95, H * 0.16, W * 0.5, 'rgba(255,77,141,.16)'); blob(W * 0.55, HZ, W * 0.7, 'rgba(63,224,255,.14)');
  // ringed planet, far parallax plane
  const px = W * 0.83, py = H * 0.105, pr = W * 0.085;
  const pg = g.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr); pg.addColorStop(0, '#9C84FF'); pg.addColorStop(1, '#2C1578');
  g.fillStyle = pg; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill();
  g.strokeStyle = 'rgba(188,172,255,.55)'; g.lineWidth = 2; g.beginPath(); g.ellipse(px, py, pr * 1.75, pr * 0.42, -0.35, 0, 7); g.stroke();
  // distant ridge line: its own parallax plane
  ridge = document.createElement('canvas'); ridge.width = 520; ridge.height = 62; const rg = ridge.getContext('2d'); let sd = 7;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let L = 0; L < 2; L++) { rg.beginPath(); rg.moveTo(0, 62); let yy = 30; for (let xx = 0; xx <= 520; xx += 13) { yy = clamp(yy + (rnd() - 0.5) * (L ? 22 : 30), L ? 30 : 8, 54); rg.lineTo(xx, yy); } rg.lineTo(520, 62); rg.closePath(); rg.fillStyle = L ? '#120A3A' : '#24146A'; rg.fill(); rg.strokeStyle = L ? 'rgba(122,90,248,.8)' : 'rgba(188,172,255,.35)'; rg.lineWidth = 1; rg.stroke(); }
  if (!G.stars.length) for (let i = 0; i < 90; i++) G.stars.push({ a: Math.random() * 6.283, d: Math.random(), s: 0.4 + Math.random() * 1.2 });
}

let PXs = 0, PYs = 0, PP = 0;
function P(x, z) { PP = 1 / (1 + KPv * z); const zc = z > 0 ? z : 0; PXs = vpx + (x * RW + W / 2 - vpx) * PP + CUR * zc * zc * RW; PYs = HZ + (PY - HZ) * PP; }

/* ---------- juice ---------- */
function burst(x, y, c, n, sp) {
  n = Math.round(n * (LOW ? 0.3 : Q === 2 ? 1 : Q === 1 ? 0.6 : 0.35)); if (G.parts.length > 260) return;
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = (0.3 + Math.random()) * (sp || 160); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.3 + Math.random() * 0.45, m: 0.75, c, s: 1.5 + Math.random() * 3 }); }
}
function pop(x, y, txt, c) { G.pops.push({ x: clamp(x, 50, W - 50), y, txt, c, l: 0.9 }); if (G.pops.length > 14) G.pops.shift(); }
let coT = 0;
function callout(a, b, cls, dur) {
  const el = $('callout'); el.className = 'on ' + (cls || ''); el.firstElementChild.textContent = a; el.lastElementChild.textContent = b || '';
  clearTimeout(coT); coT = setTimeout(() => el.classList.remove('on'), (dur || 1.6) * 1000); $('live').textContent = a + '. ' + (b || '');
}
function flash(c, a) { const f = $('flash'); f.style.background = c; f.style.transition = 'none'; f.style.opacity = LOW ? a * 0.4 : a; requestAnimationFrame(() => { f.style.transition = 'opacity .35s'; f.style.opacity = 0; }); }
function big(txt, c) { const b = $('big'); b.textContent = txt; b.style.color = c || '#fff'; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }

/* ---------- run lifecycle ---------- */
function newRun() {
  const wk = weekInfo();
  Object.assign(G, {
    clock: 0, score: 0, shown: 0, streak: 0, mult: 1, route: null, routeT: 0, shields: 3, inv: 0, charge: 0, boostT: 0, boostKills: 0, boostPaid: false,
    fx: { triple: 0, magnet: 0, bubble: 0 }, fireT: 0.4, evi: 0, cuei: 0, ents: [], bolts: [], beams: [], boss: null, gateDone: false, outro: 0, lapT: 0,
    stats: { cry: 0, kill: 0, near: 0, multi: 0, boss: 0, hits: 0, rec: 0, maxMult: 1, route: '', bossAt: 0 }, trace: [0], course: buildCourse(wk.seed), wk, lapR: mulberry(wk.seed ^ 0x9E3779B9), cryRun: 0, freeze: 0, shake: 0
  });
  ship.x = ship.tx = ship.px = 0; ship.bank = 0;
}
const CUES = [
  [0.15, () => { callout('CLEAR SKIES', 'Sweep up the crystals', 'cyan'); AU.music(0); }],
  [7, () => { callout('DRONE WAVE', 'Line up to shoot, slide out to dodge'); AU.music(1); }],
  [17, () => AU.music(2)],
  [19.3, () => {
    const cl = G.course.cyanLeft, s = ['SAFE', 'Full shields + crystal magnet'], r = ['RISK', 'Double score for 8s, more enemies'];
    const L = $('pcL'), Rr = $('pcR'); L.className = 'pc ' + (cl ? 'safe' : 'risk'); Rr.className = 'pc ' + (cl ? 'risk' : 'safe');
    [[L, cl ? s : r], [Rr, cl ? r : s]].forEach(([el, v]) => { el.firstElementChild.textContent = v[0]; el.lastElementChild.textContent = v[1]; });
    $('portalcue').hidden = false; callout('PORTAL AHEAD', 'Steer left or right to choose your route', 'amber', 2.2);
    $('live').textContent = 'Portal ahead. Left is ' + (cl ? 'safe' : 'risk') + ', right is ' + (cl ? 'risk' : 'safe') + '.';
  }],
  [27, () => { callout('PEAK CHAOS', 'Thread the gaps', 'pink'); AU.music(3); }],
  [33.2, () => { callout('WARNING', 'The Objection is inbound', 'pink', 1.9); AU.sfx('warn'); AU.buzz([60, 60, 60]); }],
  [CFG.BOSS_IN, () => { G.boss = { x: 0, z: 1.05, pods: [CFG.BOSS_POD, CFG.BOSS_POD], core: CFG.BOSS_CORE, t: 0, fl: 0, dead: false }; $('bossbar').hidden = false; AU.music(4); }],
  [35.6, () => callout('HANDLE THE OBJECTION', 'Break both pods, then the core', 'pink', 1.8)],
  [40, () => { $('timer').classList.add('hot'); }]
];

function addFx(k) {
  G.fx[k] = CFG.FX_T;
  const on = Object.keys(G.fx).filter(n => G.fx[n] > 0);
  if (on.length > 2) { const drop = on.filter(n => n !== k).sort((a, b) => G.fx[a] - G.fx[b])[0]; G.fx[drop] = 0; }
}
function charge(v) {
  if (G.boostT > 0) return; const was = G.charge; G.charge = Math.min(1, G.charge + v);
  if (was < 1 && G.charge >= 1) { AU.sfx('full'); $('live').textContent = 'Boost ready'; }
}
function award(base, x, y, c, tag) {
  const m = Math.min(CFG.MULT_CAP, G.mult * (G.routeT > 0 ? 2 : 1)), pts = base * m;
  G.score += pts; G.streak++;
  const nm = Math.min(CFG.MULT_CAP, 1 + Math.floor(G.streak / CFG.MULT_STEP));
  if (nm > G.mult) { G.mult = nm; G.stats.maxMult = Math.max(G.stats.maxMult, nm); AU.sfx('mult'); const e = $('mult'); e.classList.add('bump'); setTimeout(() => e.classList.remove('bump'), 140); }
  pop(x, y, (tag ? tag + ' ' : '') + '+' + fmt(pts), c);
}
function kill(e, x, y) {
  e.dead = true; G.stats.kill++; award(CFG.PTS.kill, x, y, COL.pink); charge(CFG.CHARGE.kill); burst(x, y, COL.pink, 14, 200); burst(x, y, COL.white, 5, 120); AU.sfx('kill');
  if (G.boostT > 0) { G.boostKills++; if (G.boostKills >= 3 && !G.boostPaid) { G.boostPaid = true; G.stats.multi++; award(CFG.PTS.multi, W / 2, PY - 90, COL.amber, 'BOOST STREAK'); } }
}
function hurt() {
  if (G.inv > 0 || G.boostT > 0) return false;
  const sx = W / 2 + ship.x * RW;
  if (G.fx.bubble > 0) { G.fx.bubble = 0; G.inv = CFG.INV; burst(sx, PY, COL.cyan, 22, 240); AU.sfx('hit'); pop(sx, PY - 50, 'BUBBLE POPPED', COL.cyan); return true; }
  G.shields--; G.stats.hits++; G.streak = 0; G.mult = 1; G.inv = CFG.INV; G.shake = 1; G.freeze = LOW ? 0 : 0.07; flash(COL.pink, 0.3); AU.sfx('hit'); AU.buzz(90);
  burst(sx, PY, COL.pink, 20, 260); const p = $('pips'); p.classList.remove('hurt'); void p.offsetWidth; p.classList.add('hurt');
  if (G.shields <= 0) {
    G.shields = 1; G.score = Math.max(0, G.score - CFG.PENALTY); G.inv = CFG.RESPAWN_INV; G.stats.rec++;
    for (const e of G.ents) if (HAZ[e.k] && e.z < 0.5) { e.dead = true; P(e.x, e.z); burst(PXs, PYs, COL.lilac, 8, 150); }
    G.beams.length = 0; callout('EMERGENCY RECOVERY', 'Shields rebooted, 500 points lost', 'pink'); pop(sx, PY - 60, '-500', COL.pink);
  }
  return true;
}
function boost() {
  if (G.state !== 'run' || G.charge < 1 || G.boostT > 0) return;
  G.boostT = CFG.BOOST_T; G.charge = 0; G.boostKills = 0; G.boostPaid = false; AU.sfx('boost'); AU.buzz(40); G.warp = 1; big('BOOST', COL.cyan);
}
function choose() {
  G.gateDone = true; $('portalcue').hidden = true;
  const cyan = (ship.x < 0) === G.course.cyanLeft; G.route = cyan ? 'c' : 'a'; G.stats.route = G.route;
  if (cyan) { G.shields = 3; addFx('magnet'); callout('SAFE ROUTE', 'Shields full, magnet on', 'cyan'); flash(COL.cyan, 0.6); }
  else { G.routeT = CFG.ROUTE_T; callout('RISK ROUTE', 'Double score for 8 seconds', 'amber'); flash(COL.amber, 0.6); }
  AU.sfx('portal'); AU.buzz(50); G.warp = 1;
}
function spawn(e) {
  if (e.k === 'beam') { if (G.boss && !G.boss.dead) G.beams.push({ at: G.clock + 0.95, end: G.clock + 1.4, lanes: e.lanes, snd: false }); return; }
  if (e.k === 'fan') { if (G.boss && !G.boss.dead) for (const l of e.lanes) G.ents.push({ id: e.id, k: 'bshot', x: LANES[l], bx: LANES[l], z: CFG.BOSS_Z, tr: 1.35 / CFG.BOSS_Z, r: R_OF.bshot, min: 9, ph: 0 }); return; }
  const tr = travelAt(e.t);
  G.ents.push({ id: e.id, k: e.k, x: e.x, bx: e.x, z: clamp((e.t - G.clock) / tr, 0.02, 1), tr, r: R_OF[e.k], hp: HP_OF[e.k] || 0, ph: e.id * 1.7, pu: e.pu, min: 9, fl: 0 });
}
function fire() {
  let tx = null, tz = 9, tr = 2;
  for (const e of G.ents) if (FOE[e.k] && !e.dead && e.z > 0.05 && e.z < 0.92 && e.z < tz && Math.abs(e.x - ship.x) < 0.3) { tz = e.z; tx = e.x; tr = e.tr; }
  const b = G.boss; let vx = 0;
  if (tx == null && b && !b.dead && b.z < CFG.BOSS_Z + 0.05) {
    const pts = [b.pods[0] > 0 ? b.x - 0.5 : null, b.pods[1] > 0 ? b.x + 0.5 : null, b.pods[0] <= 0 && b.pods[1] <= 0 ? b.x : null];
    let best = 0.36; for (const p of pts) if (p != null && Math.abs(p - ship.x) < best) { best = Math.abs(p - ship.x); tx = p; tz = b.z; tr = 1e9; }
  }
  if (tx != null) vx = clamp((tx - ship.x) / Math.max(0.06, (tz - 0.03) / (BOLT_V + 1 / tr)), -1.6, 1.6);
  G.bolts.push({ x: ship.x, z: 0.03, vx });
  if (G.fx.triple > 0) { G.bolts.push({ x: ship.x - 0.15, z: 0.03, vx }); G.bolts.push({ x: ship.x + 0.15, z: 0.03, vx }); }
  if (Q > 0) AU.sfx('shot');
}

function sim(dt) {
  if (G.freeze > 0) { G.freeze -= dt; return; }
  const ev = G.course.ev, wm = G.boostT > 0 ? CFG.BOOST_WORLD : 1;
  G.clock += dt;
  if (G.clock >= CFG.RUN) { G.clock = CFG.RUN; return endRun(); }
  while (G.cuei < CUES.length && CUES[G.cuei][0] <= G.clock) CUES[G.cuei++][1]();
  while (G.evi < ev.length && (ev[G.evi].route ? Math.max(ev[G.evi].sp, CFG.PORTAL_T + 0.06) : ev[G.evi].sp) <= G.clock) { const e = ev[G.evi++]; if (e.route && e.route !== G.route) continue; spawn(e); }
  if (G.clock >= G.trace.length) G.trace.push(G.score);

  // ship
  if (G.bot) botThink();
  if (keys.l || keys.r) ship.tx = clamp(ship.tx + (keys.r - keys.l) * 2.8 * dt, -0.95, 0.95);
  ship.px = ship.x; ship.x += (ship.tx - ship.x) * Math.min(1, dt * 22);
  ship.bank += (clamp((ship.x - ship.px) / dt * 0.3, -1, 1) - ship.bank) * Math.min(1, dt * 12);

  for (const k in G.fx) if (G.fx[k] > 0) G.fx[k] -= dt;
  if (G.inv > 0) G.inv -= dt; if (G.routeT > 0) G.routeT -= dt;
  if (G.boostT > 0) { G.boostT -= dt; if (G.boostT <= 0) G.inv = Math.max(G.inv, 0.45); }
  G.fireT -= dt; if (G.fireT <= 0) { G.fireT += CFG.FIRE; fire(); }
  G.scroll += dt * wm * 4.2;

  // boss
  const b = G.boss;
  if (b) {
    b.t += dt; if (b.fl > 0) b.fl -= dt;
    if (!b.dead) { b.z += (CFG.BOSS_Z - b.z) * Math.min(1, dt * 3.2); b.x = 0.3 * Math.sin(b.t * 0.95); }
    else { b.z += dt * 0.25; if (G.clock < 44.3) { G.lapT -= dt; if (G.lapT <= 0) { G.lapT = 0.24; const l = Math.floor(G.lapR() * 5); G.ents.push({ id: -1, k: 'cry', x: LANES[l], bx: LANES[l], z: 1, tr: 1.5, r: R_OF.cry, ph: G.clock * 9, min: 9 }); } } }
  }
  for (let i = G.beams.length - 1; i >= 0; i--) {
    const bm = G.beams[i];
    if (G.clock >= bm.at) { if (!bm.snd) { bm.snd = true; AU.sfx('beam'); G.shake = Math.max(G.shake, 0.4); } for (const l of bm.lanes) if (Math.abs(ship.x - LANES[l]) < 0.2 + 0.02) { hurt(); break; } }
    if (G.clock >= bm.end) G.beams.splice(i, 1);
  }

  // bolts
  for (const s of G.bolts) {
    s.z += dt * BOLT_V; s.x += s.vx * dt; if (s.z > 1) { s.dead = true; continue; }
    for (const e of G.ents) {
      if (!FOE[e.k] || e.dead || e.z > 0.95 || s.z < e.z - 0.03 || s.z > e.z + 0.09 || Math.abs(s.x - e.x) > e.r + 0.06) continue;
      s.dead = true; e.hp--; e.fl = 0.08; P(e.x, e.z);
      if (e.hp <= 0) kill(e, PXs, PYs - e.r * RW * PP * 1.5); else burst(PXs, PYs - e.r * RW * PP * 1.5, COL.white, 3, 90);
      break;
    }
    if (!s.dead && b && !b.dead && s.z >= b.z - 0.02 && s.z <= b.z + 0.1 && b.z < CFG.BOSS_Z + 0.06) {
      const pods = b.pods[0] > 0 || b.pods[1] > 0; let hit = -1;
      if (b.pods[0] > 0 && Math.abs(s.x - (b.x - 0.5)) < 0.19) hit = 0; else if (b.pods[1] > 0 && Math.abs(s.x - (b.x + 0.5)) < 0.19) hit = 1; else if (Math.abs(s.x - b.x) < 0.2) hit = 2;
      if (hit >= 0) {
        s.dead = true; P(hit === 2 ? b.x : b.x + (hit ? 0.5 : -0.5), b.z); const hx = PXs, hy = PYs - RW * PP * 1.25;
        if (hit < 2) { b.pods[hit]--; b.fl = 0.07; charge(CFG.CHARGE.bosshit); burst(hx, hy, COL.amber, 3, 100); if (b.pods[hit] <= 0) { G.stats.kill++; award(CFG.PTS.kill, hx, hy, COL.amber, 'POD'); burst(hx, hy, COL.amber, 26, 260); AU.sfx('kill'); G.shake = 0.5; } }
        else if (pods) burst(hx, hy, COL.lilac, 2, 60);
        else { b.core--; b.fl = 0.07; charge(CFG.CHARGE.bosshit); burst(hx, hy, COL.white, 3, 110); if (b.core <= 0) bossDown(hx, hy); }
      }
    }
  }
  // entities
  const sx = W / 2 + ship.x * RW;
  for (const e of G.ents) {
    if (e.dead) continue;
    e.z -= dt / e.tr * wm; if (e.fl > 0) e.fl -= dt;
    if (e.k === 'weav') e.x = e.bx + 0.2 * Math.sin(e.ph + G.clock * 3.2);
    if (e.k === 'gate') { if (e.z <= 0.02 && !G.gateDone) choose(); if (e.z < ZB) e.dead = true; continue; }
    if (e.k === 'cry' && (G.fx.magnet > 0 || G.boostT > 0) && e.z < 0.6) e.x += (ship.x - e.x) * Math.min(1, dt * 8);
    if (e.z <= 0.05 && e.z >= -0.045) {
      const dx = Math.abs(e.x - ship.x);
      if (e.k === 'cry') { if (dx < e.r + 0.13) { e.dead = true; G.stats.cry++; G.cryRun++; award(CFG.PTS.cry, sx, PY - 46, COL.cyan); charge(CFG.CHARGE.cry); burst(sx, PY - 20, COL.cyan, 7, 130); AU.sfx('cry', G.streak); } }
      else if (e.k === 'pu') { if (dx < 0.24) { e.dead = true; takePu(e.pu, sx); } }
      else if (dx < e.r + CFG.SHIP_R) {
        if (G.boostT > 0) { if (FOE[e.k]) kill(e, sx, PY - 40); else { e.dead = true; burst(sx, PY - 30, COL.pink, 10, 200); } }
        else if (G.inv <= 0) { e.dead = true; e.hit = true; hurt(); }
      } else if (dx < e.min) e.min = dx;
    }
    if (e.z < -0.05 && !e.dead) {
      e.dead = true;
      if (HAZ[e.k] && !e.hit && e.min < e.r + CFG.SHIP_R + CFG.NEAR && G.inv <= 0 && G.boostT <= 0) { G.stats.near++; award(CFG.PTS.near, sx, PY - 64, COL.white, 'NEAR MISS'); charge(CFG.CHARGE.near); AU.sfx('near'); }
    }
  }
  { let j = 0; for (let i = 0; i < G.ents.length; i++) if (!G.ents[i].dead) G.ents[j++] = G.ents[i]; G.ents.length = j; }
  G.bolts = G.bolts.filter(s => !s.dead);
  G.shown += (G.score - G.shown) * Math.min(1, dt * 14);
}
function takePu(k, sx) {
  AU.sfx('pu'); AU.buzz(30); burst(sx, PY - 20, COL.amber, 16, 200);
  if (k === 'shield') { G.shields = Math.min(3, G.shields + 1); addFx('bubble'); pop(sx, PY - 60, 'SHIELD BUBBLE', COL.cyan); }
  else if (k === 'triple') { addFx('triple'); pop(sx, PY - 60, 'TRIPLE SHOT', COL.amber); }
  else { addFx('magnet'); pop(sx, PY - 60, 'MAGNET', COL.lilac); }
}
function bossDown(x, y) {
  const b = G.boss; b.dead = true; G.stats.boss = 1; G.stats.bossAt = +G.clock.toFixed(1); award(CFG.PTS.boss, W / 2, HZ + 80, COL.amber, 'OBJECTION HANDLED');
  for (let i = 0; i < 5; i++) burst(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 60, [COL.pink, COL.amber, COL.white][i % 3], 26, 320);
  for (const e of G.ents) if (e.k === 'bshot') e.dead = true; G.beams.length = 0;
  G.shake = 1; G.freeze = LOW ? 0 : 0.12; flash(COL.white, 0.8); AU.sfx('boom'); AU.buzz([80, 40, 160]); callout('OBJECTION HANDLED', 'Victory lap: grab everything', 'amber', 2.2); $('bossbar').hidden = true; AU.music(2);
}
function endRun() {
  if (G.state !== 'run') return;
  G.trace.push(G.score); G.shown = G.score; G.state = 'outro'; G.outro = 0; G.beams.length = 0;
  for (const e of G.ents) if (HAZ[e.k]) e.dead = true;
  $('portalcue').hidden = true; $('bossbar').hidden = true; AU.music(-1); AU.sfx('end'); big('TIME', '#fff');
}
function botThink() {
  let best = -1e9, bl = 2;
  for (let l = 0; l < 5; l++) {
    const lx = LANES[l]; let s = -Math.abs(lx - ship.x) * 3;
    for (const e of G.ents) { if (e.dead) continue; const dx = Math.abs(e.x - lx);
      if (HAZ[e.k]) { if (e.z < 0.34 && dx < e.r + 0.24) s -= 1000; else if (FOE[e.k] && e.z > 0.4 && e.z < 0.9 && dx < 0.15) s += 9; }
      else if (e.k === 'cry' || e.k === 'pu') { if (e.z < 0.5 && dx < 0.15) s += 30 * (1 - e.z); }
      else if (e.k === 'gate' && e.z < 0.5) s += ((lx < 0) === (G.botLeft !== false) && lx !== 0) ? 60 : 0; }
    for (const bm of G.beams) if (bm.lanes.includes(l)) s -= 1000;
    const b = G.boss; if (b && !b.dead) { for (const p of [b.pods[0] > 0 ? b.x - 0.5 : null, b.pods[1] > 0 ? b.x + 0.5 : null, b.pods[0] <= 0 && b.pods[1] <= 0 ? b.x : null]) if (p != null && Math.abs(p - lx) < 0.3) s += 12; }
    if (s > best) { best = s; bl = l; }
  }
  ship.tx = LANES[bl]; if (G.charge >= 1 && G.clock > 8) boost();
}

/* ---------- rendering ---------- */
const FONT = "Unbounded,'Arial Black',system-ui,sans-serif";
const NZ = 12;
function strip(x0, x1, z0, z1) {
  ctx.beginPath();
  for (let i = 0; i <= NZ; i++) { P(x0, z0 + (z1 - z0) * i / NZ); i ? ctx.lineTo(PXs, PYs) : ctx.moveTo(PXs, PYs); }
  for (let i = NZ; i >= 0; i--) { P(x1, z0 + (z1 - z0) * i / NZ); ctx.lineTo(PXs, PYs); }
  ctx.closePath();
}
function zline(x, z0, z1) { ctx.beginPath(); for (let i = 0; i <= NZ; i++) { P(x, z0 + (z1 - z0) * i / NZ); i ? ctx.lineTo(PXs, PYs) : ctx.moveTo(PXs, PYs); } }
function floorGlow(c, x, y, r, a) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(glowS[c], x - r, y - r * 0.28, r * 2, r * 0.56); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
function drawWorld(dt) {
  const run = G.state === 'run' || G.state === 'outro' || G.state === 'paused';
  const mode = !run ? 0 : G.boss && !G.boss.dead ? 1 : G.routeT > 0 ? 2 : G.route === 'c' && G.clock < 30 ? 3 : 0;
  const tint = ['122,90,248', '255,77,141', '255,178,56', '63,224,255'][mode], tc = [COL.violet, COL.pink, COL.amber, COL.cyan][mode];
  const spd = (G.state === 'run' ? (G.boostT > 0 ? 3.2 : 1) : G.state === 'outro' ? 3 : 0.35);
  // far parallax: ridge line slides against the curve
  if (ridge) ctx.drawImage(ridge, -110 - CUR * 70 - (vpx - W / 2) * 0.5, HZ - 60, W + 220, 62);
  // stars / warp streaks
  const mr = Math.hypot(W, H) * 0.62; ctx.lineCap = 'round';
  const ns = LOW ? 30 : Q === 2 ? 90 : Q === 1 ? 55 : 30;
  for (let i = 0; i < ns; i++) {
    const s = G.stars[i]; if (G.state !== 'paused') s.d += dt * (0.05 + s.d * 0.9) * spd * s.s; if (s.d > 1) { s.d = 0.02 + Math.random() * 0.05; s.a = Math.random() * 6.283; }
    const cx = Math.cos(s.a), cy = Math.sin(s.a), r1 = s.d * mr, len = (2 + s.d * 26 * spd) * (LOW ? 0.4 : 1), x = vpx + cx * r1, y = HZ + cy * r1 * 0.9;
    if (cy > 0.12 && Math.abs(cx) < 0.8) continue;
    ctx.strokeStyle = 'rgba(214,204,255,' + (0.15 + s.d * 0.7) + ')'; ctx.lineWidth = 0.6 + s.d * 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - cx * len, y - cy * len * 0.9); ctx.stroke();
  }
  // deck: a curving ribbon with a lit centre and fogged distance
  strip(-1.06, 1.06, 1.7, ZB); const fg = ctx.createLinearGradient(0, HZ, 0, H); fg.addColorStop(0, 'rgba(' + tint + ',.42)'); fg.addColorStop(0.22, 'rgba(14,10,44,.86)'); fg.addColorStop(1, 'rgba(7,5,26,.96)'); ctx.fillStyle = fg; ctx.fill();
  strip(-0.2, 0.2, 1.7, ZB); ctx.fillStyle = 'rgba(' + tint + ',.07)'; ctx.fill();
  P(0, 1.7); glow(tc, PXs, HZ + 4, W * 0.5, 0.55);
  if (G.state !== 'run') G.scroll += dt * spd * 2;
  const fr = G.scroll % 1, N = 13;
  for (let i = 0; i < N; i++) {
    const u = (i + 1 - fr) / N, z = ZB + u * 1.35; P(-1, z); const x0 = PXs, y0 = PYs; P(1, z);
    ctx.strokeStyle = 'rgba(' + tint + ',' + (0.06 + (1 - u) * 0.42) + ')'; ctx.lineWidth = 1 + (1 - u) * 1.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(PXs, y0); ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const x = -1 + i * 0.4, edge = i === 0 || i === 5; zline(x, 1.7, ZB);
    if (edge) { ctx.strokeStyle = 'rgba(' + tint + ',.22)'; ctx.lineWidth = 9; ctx.stroke(); }
    ctx.strokeStyle = 'rgba(' + tint + ',' + (edge ? 1 : 0.24) + ')'; ctx.lineWidth = edge ? 2.5 : 1; ctx.stroke();
  }
  // roadside pylons and overhead frames give the track real depth
  const M = 5, f2 = (G.scroll * 0.325) % 1;
  for (let i = M - 1; i >= 0; i--) {
    const u = (i + 1 - f2) / M, z = ZB + u * 1.6, a = clamp((1 - u) * 2, 0, 1) * clamp(u * 7, 0, 1) * (mode === 1 ? 0.45 : 1); if (a <= 0.02) continue;
    P(-1.24, z); const lx = PXs, ly = PYs, p = PP; P(1.24, z); const rx = PXs, h = RW * p * 2.2, pw = Math.max(1.5, 7 * p);
    ctx.fillStyle = 'rgba(30,20,84,' + a + ')'; ctx.fillRect(lx - pw, ly - h, pw * 2, h); ctx.fillRect(rx - pw, ly - h, pw * 2, h);
    ctx.fillStyle = 'rgba(' + tint + ',' + a * 0.9 + ')'; ctx.fillRect(lx - pw, ly - h, pw * 0.7, h); ctx.fillRect(rx + pw * 0.3, ly - h, pw * 0.7, h);
    if (!LOW) { ctx.strokeStyle = 'rgba(' + tint + ',' + a * 0.55 + ')'; ctx.lineWidth = Math.max(1, 3 * p); ctx.beginPath(); ctx.moveTo(lx, ly - h); ctx.lineTo(rx, ly - h); ctx.stroke(); }
    if (Q > 0) { glow(tc, lx, ly - h, 6 + 26 * p, a); glow(tc, rx, ly - h, 6 + 26 * p, a); }
  }
  if (!run) return;
  // beam telegraphs and beams
  for (const bm of G.beams) {
    const live = G.clock >= bm.at, k = 1 - clamp((bm.at - G.clock) / 0.95, 0, 1);
    for (const l of bm.lanes) {
      strip(LANES[l] - 0.2, LANES[l] + 0.2, CFG.BOSS_Z, ZB);
      if (live) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,170,.9)'; ctx.fill(); strip(LANES[l] - 0.09, LANES[l] + 0.09, CFG.BOSS_Z, ZB); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      else {
        ctx.fillStyle = 'rgba(255,77,141,' + (0.1 + 0.22 * k + 0.1 * Math.sin(G.now * 22)) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(255,77,141,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
        strip(LANES[l] - 0.2, LANES[l] + 0.2, CFG.BOSS_Z * (1 - k), ZB); ctx.fillStyle = 'rgba(255,77,141,.28)'; ctx.fill();
        P(LANES[l], 0.02); ctx.fillStyle = '#fff'; ctx.font = '900 20px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('!', PXs, PYs + 7);
      }
    }
  }
  // portal lane tint
  for (const e of G.ents) if (e.k === 'gate' && !e.dead) {
    const cl = G.course.cyanLeft; strip(-1, 0, Math.max(e.z, ZB), ZB); ctx.fillStyle = cl ? 'rgba(63,224,255,.13)' : 'rgba(255,178,56,.13)'; ctx.fill();
    strip(0, 1, Math.max(e.z, ZB), ZB); ctx.fillStyle = cl ? 'rgba(255,178,56,.13)' : 'rgba(63,224,255,.13)'; ctx.fill();
  }
  // entities far to near (boss sorted in by depth)
  const list = G.ents.filter(e => !e.dead).sort((a, b) => b.z - a.z); let bossDrawn = !G.boss;
  for (const e of list) { if (!bossDrawn && e.z < G.boss.z) { drawBoss(); bossDrawn = true; } drawEnt(e); }
  if (!bossDrawn) drawBoss();
  // bolts
  ctx.lineCap = 'round';
  for (const s of G.bolts) {
    P(s.x, s.z); const x = PXs, fy = PYs, y = PYs - RW * PP * 0.2, p = PP; P(s.x - s.vx * 0.03, s.z - 0.05); const c = G.fx.triple > 0 ? COL.amber : COL.cyan;
    ctx.strokeStyle = c; ctx.lineWidth = 2 + 4 * p; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(PXs, PYs - RW * PP * 0.2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1 + 1.5 * p; ctx.stroke(); if (Q > 0) floorGlow(c, x, fy, 10 + 30 * p, 0.5);
  }
}
function poly(pts, s, x, y) { ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) { const X = x + pts[i] * s, Y = y + pts[i + 1] * s; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.closePath(); }
const SH = {
  drone: [0, 1.25, 0.95, -0.7, 0.32, -0.35, 0, -0.95, -0.32, -0.35, -0.95, -0.7],
  weav: [0, 0.9, 1.35, -0.75, 0.75, -0.2, 0, -0.55, -0.75, -0.2, -1.35, -0.75],
  brute: [0, 1.1, 0.95, 0.55, 0.95, -0.55, 0, -1.1, -0.95, -0.55, -0.95, 0.55]
};
const SHR = { drone: [0, 1.25, 0.95, -0.7, 0.32, -0.35, 0, -0.95], weav: [0, 0.9, 1.35, -0.75, 0.75, -0.2, 0, -0.55], brute: [0, 1.1, 0.95, 0.55, 0.95, -0.55, 0, -1.1] };
function tri(ax, ay, bx, by, cx, cy, f) { ctx.fillStyle = f; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill(); }
function drawEnt(e) {
  P(e.x, e.z); const a = clamp((1.03 - e.z) / 0.12, 0, 1); if (a <= 0) return;
  const x = PXs, fy = PYs, p = PP, r = e.r * RW * p * 1.15, y = fy - r * 1.6 - (e.k === 'gate' ? 0 : Math.sin(G.now * 3 + e.ph) * r * 0.12);
  ctx.globalAlpha = a;
  if (e.k === 'gate') {
    const cl = G.course.cyanLeft, hw = 0.46 * RW * p, hh = 1.25 * RW * p, t = G.now, dp = hh * 0.12;
    for (let s = 0; s < 2; s++) {
      const cyan = (s === 0) === cl, c = cyan ? COL.cyan : COL.amber; P(s ? 0.5 : -0.5, e.z); const gx = PXs;
      const arch = o => { ctx.beginPath(); ctx.moveTo(gx - hw, fy); ctx.lineTo(gx - hw, fy - hh * 0.6 - o); ctx.quadraticCurveTo(gx - hw, fy - hh - o, gx, fy - hh - o); ctx.quadraticCurveTo(gx + hw, fy - hh - o, gx + hw, fy - hh * 0.6 - o); ctx.lineTo(gx + hw, fy); };
      ctx.lineWidth = 1.5 + 5 * p; arch(dp); ctx.strokeStyle = cyan ? '#12708A' : '#8A5A12'; ctx.stroke();
      arch(0); ctx.fillStyle = cyan ? 'rgba(63,224,255,.16)' : 'rgba(255,178,56,.16)'; ctx.fill(); ctx.strokeStyle = c; ctx.stroke();
      glow(c, gx, fy - hh * 0.5, hh * (0.9 + 0.1 * Math.sin(t * 6)), 0.5 * a); floorGlow(c, gx, fy, hw * 1.6, 0.6 * a);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 ' + Math.max(8, hh * 0.3) + 'px ' + FONT; ctx.fillText(cyan ? 'SAFE' : 'x2', gx, fy - hh * 0.42);
    }
    ctx.globalAlpha = 1; return;
  }
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, fy, r * 0.9, r * 0.26, 0, 0, 7); ctx.fill();
  if (e.k === 'cry') {
    // a spinning octahedron: four facets, the seam slides as it turns
    const sx = x + Math.sin(G.now * 2.6 + e.ph) * r * 0.8, t = y - r * 1.35, b = y + r * 1.35, l = x - r * 0.85, rt = x + r * 0.85;
    if (Q > 0) { glow(COL.cyan, x, y, r * 2.6, 0.55 * a); floorGlow(COL.cyan, x, fy, r * 2.2, 0.5 * a); }
    tri(x, t, l, y, sx, y, '#B8F6FF'); tri(x, t, sx, y, rt, y, '#3FE0FF'); tri(x, b, l, y, sx, y, '#27B4DA'); tri(x, b, sx, y, rt, y, '#1486B0');
  } else if (e.k === 'mine' || e.k === 'bshot') {
    glow(COL.pink, x, y, r * 2.4, 0.5 * a); floorGlow(COL.pink, x, fy, r * 2.4, 0.55 * a);
    ctx.save(); ctx.translate(x, y); ctx.rotate(G.now * (e.k === 'mine' ? 1.6 : 6) + e.ph);
    ctx.fillStyle = '#C22C68'; ctx.beginPath(); const n = e.k === 'mine' ? 8 : 4; for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * 0.6 : r * 1.38, an = i * Math.PI / n; i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(rr, 0); } ctx.closePath(); ctx.fill(); ctx.restore();
    const sg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r * 0.86); sg.addColorStop(0, '#FFC2DA'); sg.addColorStop(0.45, '#FF4D8D'); sg.addColorStop(1, '#6A123C');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, r * 0.84, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * (0.16 + 0.05 * Math.sin(G.now * 10 + e.ph)), 0, 7); ctx.fill();
    if (e.k === 'bshot') { P(e.x, 0); ctx.strokeStyle = 'rgba(255,77,141,.55)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(PXs, PYs); ctx.stroke(); ctx.setLineDash([]); }
  } else if (e.k === 'pu') {
    // a thick spinning coin
    const c = e.pu === 'shield' ? COL.cyan : e.pu === 'triple' ? COL.amber : COL.lilac, R2 = r * 1.3, cs = Math.cos(G.now * 2.2 + e.ph), wx = Math.max(0.22, Math.abs(cs)), th = R2 * 0.3 * (1 - wx) * Math.sign(cs || 1);
    glow(c, x, y, R2 * 2.6, 0.7 * a); floorGlow(c, x, fy, R2 * 2.4, 0.7 * a);
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + th, y, R2 * wx, R2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#120E33'; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.2, R2 * 0.14); ctx.beginPath(); ctx.ellipse(x - th, y, R2 * wx, R2, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(x - th, y); ctx.scale(wx, 1); ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.2, R2 * 0.2); ctx.lineJoin = 'round'; ctx.beginPath();
    if (e.pu === 'shield') { ctx.moveTo(0, -R2 * 0.55); ctx.lineTo(R2 * 0.45, -R2 * 0.3); ctx.lineTo(R2 * 0.4, R2 * 0.2); ctx.lineTo(0, R2 * 0.58); ctx.lineTo(-R2 * 0.4, R2 * 0.2); ctx.lineTo(-R2 * 0.45, -R2 * 0.3); ctx.closePath(); }
    else if (e.pu === 'triple') { for (let i = -1; i <= 1; i++) { ctx.moveTo(i * R2 * 0.38, R2 * 0.45); ctx.lineTo(i * R2 * 0.38, -R2 * (i ? 0.25 : 0.55)); } }
    else { ctx.moveTo(-R2 * 0.4, -R2 * 0.5); ctx.lineTo(-R2 * 0.4, R2 * 0.05); ctx.arc(0, R2 * 0.05, R2 * 0.4, Math.PI, 0, true); ctx.lineTo(R2 * 0.4, -R2 * 0.5); }
    ctx.stroke(); ctx.restore();
  } else {
    // slab-extruded hull, lit from the left, banking with its own motion
    const tilt = e.k === 'weav' ? Math.cos(e.ph + G.clock * 3.2) * 0.35 : 0, d = r * 0.34, fl = e.fl > 0;
    if (Q > 0) { glow(COL.pink, x, y, r * 2.2, 0.35 * a); floorGlow(COL.pink, x, fy, r * 2.2, 0.5 * a); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    ctx.fillStyle = fl ? '#fff' : '#4A0D2C'; poly(SH[e.k], r, 0, d); ctx.fill(); poly(SH[e.k], r, 0, d * 0.5); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : e.k === 'brute' ? '#E8397A' : e.k === 'weav' ? '#FF8CBC' : '#FF5C98'; poly(SH[e.k], r, 0, 0); ctx.fill();
    if (!fl) { ctx.fillStyle = 'rgba(70,6,40,.38)'; poly(SHR[e.k], r, 0, 0); ctx.fill(); ctx.fillStyle = '#7A1746'; poly(SH[e.k], r * 0.5, 0, r * 0.06); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, r * 0.18, r * 0.2, 0, 7); ctx.fill(); ctx.fillStyle = COL.pink; ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.09, 0, 7); ctx.fill();
    if (e.k === 'brute') { ctx.fillStyle = COL.amber; for (let i = 0; i < e.hp; i++) ctx.fillRect(-r * 0.5 + i * r * 0.4, -r * 1.6, r * 0.26, r * 0.16); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
const HULL = [-1.25, -0.2, -0.75, -0.75, -0.3, -0.5, 0, -0.95, 0.3, -0.5, 0.75, -0.75, 1.25, -0.2, 0.9, 0.35, 0.3, 0.2, 0, 0.6, -0.3, 0.2, -0.9, 0.35];
function drawBoss() {
  const b = G.boss; if (!b || b.z > 1.4) return; P(b.x, b.z); const u = RW * PP, x = PXs, fy = PYs, y = fy - u * 1.25 + Math.sin(b.t * 2.2) * u * 0.06, wh = b.fl > 0;
  const a = b.dead ? clamp(1 - (b.z - CFG.BOSS_Z) * 4, 0, 1) : clamp((1.05 - b.z) * 3, 0, 1); if (a <= 0) return; ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, fy, u * 1.1, u * 0.2, 0, 0, 7); ctx.fill(); floorGlow(COL.pink, x, fy, u * 1.8, 0.6 * a);
  glow(COL.pink, x, y, u * 2.3, 0.4 * a);
  ctx.fillStyle = '#2A0719'; poly(HULL, u, x, y + u * 0.2); ctx.fill(); poly(HULL, u, x, y + u * 0.1); ctx.fill();
  ctx.fillStyle = wh ? '#8A2A5C' : '#5B1238'; poly(HULL, u, x, y); ctx.fill(); ctx.strokeStyle = COL.pink; ctx.lineWidth = Math.max(1.5, u * 0.05); ctx.stroke();
  ctx.fillStyle = 'rgba(20,0,12,.35)'; poly([0, -0.95, 0.3, -0.5, 0.75, -0.75, 1.25, -0.2, 0.9, 0.35, 0.3, 0.2, 0, 0.6], u, x, y); ctx.fill();
  ctx.fillStyle = wh ? '#fff' : '#8E1F58'; poly([-0.7, -0.25, 0, -0.6, 0.7, -0.25, 0.3, 0.05, 0, 0.3, -0.3, 0.05], u, x, y); ctx.fill();
  const pd = RW * PP * 0.5;
  for (let i = 0; i < 2; i++) {
    const px = x + (i ? pd : -pd), py = y + u * 0.42, live = b.pods[i] > 0;
    ctx.fillStyle = '#16050F'; ctx.beginPath(); ctx.arc(px, py + u * 0.08, u * 0.26, 0, 7); ctx.fill();
    ctx.fillStyle = live ? '#2B0A1E' : '#1a1026'; ctx.beginPath(); ctx.arc(px, py, u * 0.26, 0, 7); ctx.fill();
    if (live) { glow(COL.amber, px, py, u * 0.6, 0.8 * a); ctx.fillStyle = COL.amber; ctx.beginPath(); ctx.arc(px, py, u * 0.15 + Math.sin(b.t * 9 + i) * u * 0.02, 0, 7); ctx.fill(); ctx.strokeStyle = COL.amber; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, u * 0.26, -1.57, -1.57 + 6.283 * b.pods[i] / CFG.BOSS_POD); ctx.stroke(); }
  }
  const open = b.pods[0] <= 0 && b.pods[1] <= 0;
  ctx.fillStyle = open ? '#fff' : '#3A0A22'; ctx.beginPath(); ctx.arc(x, y - u * 0.12, u * 0.2, 0, 7); ctx.fill();
  if (open && !b.dead) { glow(COL.white, x, y - u * 0.12, u * 0.75, 0.9 * a); ctx.strokeStyle = COL.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - u * 0.12, u * 0.3, -1.57, -1.57 + 6.283 * b.core / CFG.BOSS_CORE); ctx.stroke(); }
  else if (!b.dead) { ctx.strokeStyle = 'rgba(255,77,141,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - u * 0.12, u * 0.3, 0, 7); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
/* The ship is the RockED rocket mark itself (traced from the supplied artwork), extruded into a slab
   that rolls about its long axis as you steer. */
const LOGO = new Path2D(LOGO_D), LOGO_GLASS = new Path2D(LOGO_HULL), SPR = {};
const SPH = 440, SPW = 250, SPU = SPH / 2 * 0.95;
function mkShip() {
  const mk = f => { const c = document.createElement('canvas'); c.width = SPW; c.height = SPH; const g = c.getContext('2d'); g.translate(SPW / 2, SPH / 2); g.scale(SPU, SPU); f(g); return c; };
  SPR.face = mk(g => {
    const gl = g.createLinearGradient(0, -1, 0, 0.6); gl.addColorStop(0, 'rgba(40,22,120,.6)'); gl.addColorStop(1, 'rgba(12,6,44,.72)'); g.fillStyle = gl; g.fill(LOGO_GLASS);
    const lg = g.createLinearGradient(0, -1, 0, 1); lg.addColorStop(0, '#5639FC'); lg.addColorStop(0.5, '#6030F0'); lg.addColorStop(0.78, '#6F23DE'); lg.addColorStop(1, '#6F23DE'); g.fillStyle = lg; g.fill(LOGO, 'evenodd');
    g.globalCompositeOperation = 'source-atop'; const hl = g.createLinearGradient(-0.5, -1, 0.4, 0.2); hl.addColorStop(0, 'rgba(255,255,255,.5)'); hl.addColorStop(0.5, 'rgba(255,255,255,.08)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(-1, -1.1, 2, 2.2);
  });
  SPR.wall = mk(g => { g.fillStyle = '#3C1FC0'; g.fill(LOGO, 'evenodd'); });
  SPR.deep = mk(g => { g.fillStyle = '#1D0B66'; g.fill(LOGO, 'evenodd'); });
}
mkShip();
function drawShip(x, y, s, roll, o) {
  o = o || {}; const t = G.now, fl = (o.flame == null ? 1 : o.flame) * (0.85 + 0.15 * Math.sin(t * 38));
  const ang = roll * 0.95, c = Math.cos(ang), sn = Math.sin(ang), k = s / SPU, dw = SPW * k * c, dh = SPH * k;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x, y + s * 1.42, s * 0.55 * c + 4, s * 0.13, 0, 0, 7); ctx.fill();
  if (!o.ghost) { floorGlow(COL.cyan, x, y + s * 1.42, s * 1.5, 0.55); glow(COL.cyan, x, y + s * (0.95 + fl * 0.3), s * (0.8 + fl * 0.45), 0.7); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(roll * 0.17); if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (!o.ghost) {
    // three jets: the centre notch and both fins
    const jet = (jx, jy, w, len) => { const eg = ctx.createLinearGradient(0, jy, 0, jy + len); eg.addColorStop(0, '#fff'); eg.addColorStop(0.25, COL.cyan); eg.addColorStop(0.7, 'rgba(122,90,248,.65)'); eg.addColorStop(1, 'rgba(98,47,238,0)'); ctx.fillStyle = eg; ctx.beginPath(); ctx.moveTo(jx - w, jy); ctx.quadraticCurveTo(jx, jy + len * 1.7, jx + w, jy); ctx.closePath(); ctx.fill(); };
    jet(0, s * 0.62, s * 0.13, s * (0.55 + fl * 0.75)); jet(-s * 0.37 * c, s * 0.96, s * 0.1 * c, s * (0.2 + fl * 0.42)); jet(s * 0.37 * c, s * 0.96, s * 0.1 * c, s * (0.2 + fl * 0.42));
    const n = LOW || Q === 0 ? 4 : 8, st = s * 0.34 / n;
    for (let i = n; i >= 1; i--) ctx.drawImage(i > n / 2 ? SPR.deep : SPR.wall, -sn * i * st - dw / 2, i * st * 0.42 - dh / 2, dw, dh);
  }
  ctx.drawImage(SPR.face, -dw / 2, -dh / 2, dw, dh);
  ctx.restore(); ctx.globalAlpha = 1;
  if (!o.ghost) glow(COL.cyan, x, y, s * (0.5 + 0.08 * Math.sin(t * 6)), 0.55);
}
function drawFx(dt) {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = G.parts.length - 1; i >= 0; i--) {
    const p = G.parts[i]; p.l -= dt; if (p.l <= 0) { G.parts[i] = G.parts[G.parts.length - 1]; G.parts.pop(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy = p.vy * 0.96 + 140 * dt;
    ctx.globalAlpha = Math.min(1, p.l / p.m * 1.6); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center';
  for (let i = G.pops.length - 1; i >= 0; i--) {
    const p = G.pops[i]; p.l -= dt; if (p.l <= 0) { G.pops.splice(i, 1); continue; } p.y -= 46 * dt;
    ctx.globalAlpha = Math.min(1, p.l * 2.5); ctx.font = '700 12px ' + FONT; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(6,5,26,.85)'; ctx.strokeText(p.txt, p.x, p.y); ctx.fillStyle = p.c; ctx.fillText(p.txt, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}
const trail = [];
function render(dt) {
  if (!W) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const run = G.state === 'run' || G.state === 'outro' || G.state === 'paused', live = G.state === 'run' || G.state === 'outro';
  const cam = run ? ship.x : Math.sin(G.now * 0.5) * 0.3; vpx = W / 2 - cam * W * 0.07;
  // camera: the track sweeps through long curves, and boost widens the field of view
  const tc = run ? G.clock : G.now * 0.6;
  if (G.state !== 'paused') CUR = LOW ? 0 : (0.2 * Math.sin(tc * 0.42) + 0.1 * Math.sin(tc * 0.93 + 1.3)) * (run ? clamp(G.clock / 3, 0, 1) : 0.7);
  KPv += ((live && G.boostT > 0 ? 3.6 : 5) - KPv) * Math.min(1, dt * 7); ZB = (1 / ((H - HZ) / (PY - HZ)) - 1) / KPv;
  ctx.drawImage(bg, -20 - cam * 9, 0, W + 40, H);
  ctx.save();
  if (G.shake > 0) { if (!LOW) ctx.translate((Math.random() - 0.5) * 16 * G.shake, (Math.random() - 0.5) * 12 * G.shake); G.shake = Math.max(0, G.shake - dt * 3.2); }
  if (run && !LOW) { ctx.translate(W / 2, PY); ctx.rotate(-ship.bank * 0.028); ctx.translate(-W / 2, -PY); }
  drawWorld(dt);
  if (run) {
    const sx = W / 2 + ship.x * RW, s = RW * 0.235, bst = G.boostT > 0;
    let sy = PY - s * 0.75 + Math.sin(G.now * 4) * 2;
    if (G.state === 'outro') sy -= Math.pow(G.outro, 2.4) * H * 0.9;
    // wingtip light ribbons
    if (G.state !== 'paused') { for (let i = 0; i < trail.length; i++) trail[i] += (sx - trail[i]) * Math.min(1, dt * 14); trail.unshift(sx); if (trail.length > 11) trail.pop(); }
    if (!LOW && Q > 0) { ctx.lineCap = 'round'; for (let sd = -1; sd <= 1; sd += 2) for (let i = 1; i < trail.length; i++) { ctx.strokeStyle = 'rgba(63,224,255,' + (0.5 * (1 - i / trail.length)) + ')'; ctx.lineWidth = 3 * (1 - i / trail.length) + 0.5; ctx.beginPath(); ctx.moveTo(trail[i - 1] + sd * s * 0.37, sy + s + (i - 1) * (bst ? 13 : 7)); ctx.lineTo(trail[i] + sd * s * 0.37, sy + s + i * (bst ? 13 : 7)); ctx.stroke(); } }
    if (bst && !LOW) for (let i = 3; i >= 1; i--) drawShip(sx - ship.bank * i * 5, sy + i * s * 0.7, s, ship.bank, { alpha: 0.2, ghost: 1 });
    const blink = G.inv > 0 && G.boostT <= 0 && Math.sin(G.now * 40) > 0;
    drawShip(sx, sy, s, ship.bank, { alpha: blink ? 0.35 : 1, flame: bst || G.state === 'outro' ? 2.2 : 1 });
    if (G.fx.bubble > 0) { ctx.strokeStyle = COL.cyan; ctx.lineWidth = 2; ctx.globalAlpha = G.fx.bubble < 1.5 ? 0.4 + 0.4 * Math.sin(G.now * 20) : 0.85; ctx.beginPath(); ctx.arc(sx, sy, s * 1.35, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; glow(COL.cyan, sx, sy, s * 2, 0.25); }
    if (G.fx.magnet > 0) { ctx.strokeStyle = 'rgba(188,172,255,.5)'; ctx.lineWidth = 1.5; const rr = s * (1.4 + ((G.now * 1.5) % 1) * 1.5); ctx.globalAlpha = 1 - ((G.now * 1.5) % 1); ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  } else if (G.state === 'home' || G.state === 'load' || G.state === 'tut') {
    const s = Math.min(W * 0.27, H * 0.15, 130); drawShip(W / 2, H * 0.45 + Math.sin(G.now * 1.3) * 6, s, Math.sin(G.now * 0.8) * 0.85, { flame: 1.3 });
  }
  drawFx(G.state === 'paused' ? 0 : dt);
  ctx.restore();
  if (G.warp > 0) { G.warp = Math.max(0, G.warp - dt * 1.4); }
  if (run && (G.boostT > 0 || G.warp > 0) && !LOW) {
    const a = Math.max(G.boostT > 0 ? 0.55 : 0, G.warp * 0.6), g = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.2, W / 2, H * 0.5, H * 0.75);
    g.addColorStop(0, 'rgba(63,224,255,0)'); g.addColorStop(1, 'rgba(63,224,255,' + a + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}
