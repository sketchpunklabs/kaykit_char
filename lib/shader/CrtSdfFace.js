import * as THREE from 'three';

export default class CrtSdfFace extends THREE.RawShaderMaterial {
    constructor( props={} ){
        super();
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Merge custom props with default options
        const opts = Object.assign({
            offset : [ 0, 1, 0 ],
            color  : new THREE.Color( '#00ff00' ),
        }, props );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.name             = 'CustomMaterial';
        this.glslVersion      = THREE.GLSL3;
        this.depthTest        = true
        // this.transparent      = true;
        // this.alphaToCoverage  = true;
        this.side             = THREE.DoubleSide;
        // this.lights           = false;

        this.uniforms = {
          //   offset  : { value: opts.offset },
          color   : { value: opts.color },
        };

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.vertexShader = `
        in vec3 position;
        in vec3 normal;
        in vec2 uv;

        uniform mat4 modelMatrix;       // To WorldSpace
        uniform mat4 viewMatrix;        // To ViewSpace
        uniform mat4 projectionMatrix;  // To NDC ( Normalized Device Coordinate Space ) aka ScreenSpace

        // uniform vec3 offset;

        out vec3 fragWPos;
        out vec3 fragWNorm;
        out vec2 fragUV;

        void main(){
            vec4 wpos   = modelMatrix * vec4( position, 1.0 );

            fragWPos    = wpos.xyz;
            fragUV      = uv;
            fragWNorm   = ( modelMatrix * vec4( normal, 0.0 ) ).xyz;

            gl_Position = projectionMatrix * viewMatrix * wpos;
        }`;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.fragmentShader = `precision mediump float;
        in vec3 fragWPos;
        in vec2 fragUV;
        in vec3 fragWNorm;

        out vec4 outColor;

        // uniform vec3 cameraPosition;
        uniform vec3 color;

        vec2 curveRemapUV( vec2 uv, vec2 curv ){
            // as we near the edge of our screen apply greater distortion using a sinusoid.
            uv = uv * 2.0 - 1.0; // 0:1 to -1:1
            vec2 offset = abs(uv.yx) / curv;
            uv = uv + uv * offset * offset;
            uv = uv * 0.5 + 0.5; // -1:1 to 0:1
            return uv;
        }

        #define PI 3.1415926538
        float scanLineIntensity( float uv, float resolution, float opacity ){
            float intensity = sin( uv * resolution * PI * 2.0 );         // Create sections, value -1:1
            intensity       = ( ( 0.5 * intensity ) + 0.5 ) * 0.9 + 0.1; // Remap -1:1 to 0:1, apply range with min
            return pow( intensity, opacity );                            // Kinda like blurs the gradiant??
        }

        float vignetteIntensity( vec2 uv, vec2 res, float opacity ){
            float intensity = uv.x * uv.y * ( 1.0 - uv.x ) * ( 1.0 - uv.y );
            return clamp( pow( (res.x * 0.25) * intensity, opacity ), 0.0, 1.0 );
        }

        void main(){
            vec3 norm = normalize( fragWNorm );
            outColor  = vec4( color, 1.0 );

            vec2 remappedUV = curveRemapUV( fragUV, vec2(2.0, 2.0) );
            vec2 res = vec2( 20.0, 20.0 );
            vec4 baseColor = vec4( 1.0, 0.0, 0.0, 1.0 );

            baseColor.rgb *= vignetteIntensity( remappedUV, res, 0.4 );
            baseColor.rgb *= scanLineIntensity( remappedUV.x, res.y, 1.0 );
            baseColor.rgb *= scanLineIntensity( remappedUV.y, res.x, 1.0 );

            baseColor.rgb *= 2.0; // Brighten things up after lots of darkening effects

            if (remappedUV.x < 0.0 || remappedUV.y < 0.0 || remappedUV.x > 1.0 || remappedUV.y > 1.0){
                outColor = vec4(0.0, 0.0, 0.0, 1.0);
            } else {
                outColor = baseColor; //vec4(1.0, 0.0, 0.0, 1.0);
            }
        }`;
    }
}
