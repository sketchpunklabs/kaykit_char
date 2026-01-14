
export class Task{
    constructor(){
        this.priority   = 50;
        this.name       = 'task';
    }
    execute( dt, et ){ return true; }
}

export class PopMeshTask extends Task{
    mesh    = null
    clock   = 0;
    ease    = null;
    aScl    = 0;
    bScl    = 1;
    time    = 1;
    constructor( m, time=1, ease=null ){
        super();
        this.mesh = m;
        this.time = time;
        this.ease = ease;
    }

    execute( dt, et ){
        const t = Math.max( 0, Math.min( 1, ( this.clock += dt ) / this.time ) );
        const j = this.ease? this.ease( t ) : t;

        const s = this.aScl * (1 - j) + this.bScl * j;

        this.mesh.scale.setScalar( s );
        // console.log(this.mesh.name, t);

        return ( t >= 1 );
    }

    static show( m, time=1, ease=null ){
        const t = new PopMeshTask( m, time, ease );
        m.visible = true;
        m.scale.setScalar( 0 );
        return t;
    }

    static hide( m, time=1, ease=null ){
        const t   = new PopMeshTask( m, time, ease );
        t.aScl    = 1;
        t.bScl    = 0;
        m.visible = true;
        m.scale.setScalar( 1 );
        return t;
    }
}

export class FrameTaskQueue{
    items = [];
    constructor(){}

    enqueue( task ){
        this.items.push( task );
        this.items.sort((a, b) => {
            a.priority === b.priority ? 0 : a.priority < b.priority ? 1 : -1;
        });
        return this;
    }

    process( dt, et ){
        let t;
        let isDone = false;
        for (let i = this.items.length - 1; i >= 0; i-- ){

            try {
                isDone = this.items[i].execute( dt, et );
            }catch( e ){
                console.log("error");
                isDone = true;
            }

            if( isDone ) this.items.splice( i, 1 );
        }
    }
}
