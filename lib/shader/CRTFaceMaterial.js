import * as THREE           from 'three';

export default function CRTFaceMaterial(){
    const mat = new THREE.MeshStandardMaterial({
        color       : 0xffffff,
        roughness   : 0.6,
        metalness   : 0.2,
    });

    // Hacky way to have control over uniforms created before compile
    const uniforms = {
        nface: { value: 0 },
    };

    mat.defines = { 'USE_UV': '' }; // Force UV without textures, var is vUv

    mat.onBeforeCompile = sh => {
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // sh.uniforms.unlitColor = { value: new THREE.Color('#0D1016') };
        sh.uniforms.unlitColor  = { value: new THREE.Color('#171C26') };
        sh.uniforms.litColor    = { value: new THREE.Color('#ffffff') };
        sh.uniforms.nface       = uniforms.nface;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        sh.fragmentShader = `
        uniform float tm;
        uniform vec3 unlitColor;
        uniform vec3 litColor;
        uniform float nface;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // CRT
        vec2 curveUV( vec2 uv, vec2 curv ){
            // as we near the edge of our screen apply greater distortion using a sinusoid.
            uv          = uv * 2.0 - 1.0;               // 0:1 to -1:1
            vec2 offset = abs( uv.yx ) / curv;          // Larger offset away from center
            uv          = uv + uv * offset * offset;    // Compute & add distortion to uv
            uv          = uv * 0.5 + 0.5;               // -1:1 to 0:1
            return uv;
        }

        float scanLineIntensity( float uv, float res, float opacity ){
            float intensity = sin( uv * res * 3.1415926538 * 2.0 );      // Create sections, value -1:1
            intensity       = ( ( 0.5 * intensity ) + 0.5 ) * 0.9 + 0.1; // Remap -1:1 to 0:1, apply range with min
            return pow( intensity, opacity );                            // Kinda like blurs the gradiant??
        }

        float vignetteIntensity( vec2 uv, vec2 res, float opacity ){
            float intensity = uv.x * uv.y * ( 1.0 - uv.x ) * ( 1.0 - uv.y );
            return clamp( pow( (res.x * 0.25) * intensity, opacity ), 0.0, 1.0 );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SDF
        float sdCircle( vec2 p, float r ){ return length( p ) - r; }
        float opOnion( float d, float r ) { return abs( d ) - r; }

        // UV, PosA, PosB
        float sdSegment( in vec2 p, in vec2 a, in vec2 b ){
            vec2 pa = p-a, ba = b-a;
            float h = clamp( dot(pa,ba) / dot(ba,ba), 0.0, 1.0 );
            return length( pa - ba * h );
        }

        // UV-Pos, [sin,cos], Radius, Padding Radius
        // sdArc( iv - vec2(0.5,0.7), vec2( sin(PI * 0.5 / 2), cos(PI * 0.5 / 2) ), 0.04, 0.01 )
        float sdArc( in vec2 p, in vec2 sc, in float ra, float rb ){
            // sc is the sin/cos of the arc's aperture
            p.x = abs(p.x);
            return ((sc.y*p.x>sc.x*p.y) ? length(p-sc*ra) : abs(length(p)-ra)) - rb;
        }

        // https://www.shadertoy.com/view/tlSGzG
        float sdArc2( vec2 p, float a0, float a1, float r ){
            float a = mod(atan(p.y, p.x), radians(360.));

            float ap = a - a0;
            if( ap < 0. ) ap += radians(360.);

            float a1p = a1 - a0;
            if( a1p < 0. ) a1p += radians(360.);

            // is a outside [a0, a1]?
            // https://math.stackexchange.com/questions/1044905/simple-angle-between-two-angles-of-circle
            if (ap >= a1p) {
                // snap to the closest of the two endpoints
                vec2 q0 = vec2(r * cos(a0), r * sin(a0));
                vec2 q1 = vec2(r * cos(a1), r * sin(a1));
                return min(length(p - q0), length(p - q1));
            }

            return abs(length(p) - r);
        }

        float sdOrientedBox( in vec2 p, in vec2 a, in vec2 b, float th ){
            float l = length(b-a);
            vec2  d = (b-a)/l;
            vec2  q = (p-(a+b)*0.5);
                  q = mat2(d.x,-d.y,d.y,d.x)*q;
                  q = abs(q)-vec2(l,th)*0.5;
            return length(max(q,0.0)) + min(max(q.x,q.y),0.0);
        }

        float dot2( in vec2 v ){ return dot(v,v); }
        float sdHeart( in vec2 p ){
            p.x = abs(p.x);
            if( p.y+p.x>1.0 ) return sqrt(dot2(p-vec2(0.25,0.75))) - sqrt(2.0)/4.0;

            return sqrt( min(dot2(p-vec2(0.00,1.00)), dot2(p-0.5*max(p.x+p.y,0.0)))) * sign(p.x-p.y);
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // FACES
        float face_0( vec2 uv ){
            float eyel = opOnion( sdCircle( uv - vec2( 0.36, 0.72), 0.055 ), 0.005 );
            eyel = 1.0 - smoothstep( 0.0, 0.01, eyel );

            float eyer = opOnion( sdCircle( uv - vec2( 0.64, 0.72), 0.055 ), 0.005 );
            eyer = 1.0 - smoothstep( 0.0, 0.01, eyer );

            return max( eyel, eyer );
        }

        float face_1( vec2 uv ){
            float maskArc = sdArc2( uv - vec2(0.5, 0.6), radians( 180.0 ), radians( 450.0 ), 0.08 );
            float maskLn  = sdSegment( uv, vec2(0.5, 0.68), vec2(0.5, 0.75) );
            float maskDot = sdCircle( uv - vec2(0.5, 0.87), 0.006 );

            float fmask = min( min( maskArc, maskLn ), maskDot );
            return 1.0 - smoothstep( 0.001, 0.0011, fmask-0.04 );
        }

        float face_2( vec2 uv ){
            vec2 mUV    = vec2( abs( uv.x-0.5 ), uv.y - 0.5 ); // Split UV and Mirror it
            float eyes  = sdCircle( mUV - vec2(0.15, 0.2), 0.03 );
            float mouth = sdArc2( mUV - vec2(0.043, 0.3), radians( 20.0 ), radians( 160.0 ), 0.05 );

            float fmask = min( eyes, mouth );
            return 1.0 - smoothstep( 0.005, 0.0051, fmask - 0.01 );
        }

        float face_3( vec2 uv ){
            vec2 mUV    = vec2( abs( uv.x-0.5 ), uv.y - 0.5 ); // Split UV and Mirror it
            float mask  = sdOrientedBox( mUV, vec2( 0.1, 0.2 ), vec2( 0.22, 0.2 ), 0.001 );
            return 1.0 - smoothstep( 0.001, 0.0011, mask-0.03  );
        }

        float face_4( vec2 uv ){
            vec2 scl   = vec2( 3.8 ); // Larger numbers makes smaller UVs
            vec2 mov   = vec2( -0.5, -0.15 );
            uv         = 1.0 - uv; // 180 Deg Rot

            float mask = sdHeart( ( uv + mov ) * scl );
            return 1.0 - smoothstep( 0.001, 0.0011, mask );
        }

        ` + sh.fragmentShader;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        sh.fragmentShader = sh.fragmentShader.replace(
            '#include <color_fragment>', `
            diffuseColor.rgb = vec3( vUv, 0.0 );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // UV is stretched a bit, use a power curve to fix it
            vec2 cUV    = vec2( vUv.x, pow( vUv.y, 1.7 ) );
            vec2 res    = vec2( 40.0, 40.0 );
            float blur  = 1.0;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            int i      = int( nface );
            float mask = 0.0;

            if( i == 1 )        mask = face_1( cUV );
            else if( i == 2 )   mask = face_2( cUV );
            else if( i == 3 )   mask = face_3( cUV );
            else if( i == 4 )   mask = face_4( cUV );
            else                mask = face_0( cUV );

            vec3 bColor = mix( unlitColor, litColor, mask );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            bColor.rgb *= vignetteIntensity( cUV, res, 1.5 );
            bColor.rgb *= scanLineIntensity( cUV.x, res.y, blur );
            bColor.rgb *= scanLineIntensity( cUV.y, res.x, blur );
            bColor.rgb *= 3.5; // Brighten things up after lots of darkening effects

            diffuseColor.rgb = bColor;
            `
        );
    };

   	Object.defineProperty( mat, 'face', { set: function (v) { uniforms.nface.value = v; } });

    return mat
}
