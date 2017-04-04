$(function(){
  var gamecanvas=$('#gamecanvas')[0];
  var canvas = document.createElement('canvas');
  canvas.style.zIndex   = 1;
  canvas.width=gamecanvas.clientWidth;
  canvas.height=gamecanvas.clientHeight;
  canvas.style.position = "absolute";
  canvas.style.border   = "1px solid";
  gamecanvas.appendChild(canvas);
  var c2 = canvas.getContext('2d');
  //initializing
  var voropoly=[];
  var tri = [];
  var points = [];
  //adding surrounding supertriangle for Boyer-Watson Delunuay Triangulation
  points.push({x:300,y:-600,type:'supertriangle'});//0
  points.push({x:-900,y:1200,type:'supertriangle'});//1
  points.push({x:1500,y:1200,type:'supertriangle'});//2
  tri.push({p1:0,p2:1,p3:2});
  var ccout=cc(tri[0]);
  tri[0].cc=ccout.cc;
  tri[0].cr=ccout.cr;
  var player=1;
  var turn=1;

  ////Core drawing functions
  function drawpoly(points,color){//draw polygon given points
    c2.fillStyle = color;
    c2.beginPath();
    for(var i=0;i<points.length;i++){
      if (i===0){c2.moveTo(points[i].x,points[i].y);}
      else{c2.lineTo(points[i].x,points[i].y);}
    }
    c2.closePath();
    c2.fill();
  }
  function drawline (points,color){//draw lines in order of given points, and loop back around to index 0
    c2.strokeStyle = color;
    //c2.setLineDash([5, 10]);
    c2.lineWidth=5;
    c2.beginPath();
    for(var i=0;i<points.length;i++){
      if (i===0){c2.moveTo(points[i].x,points[i].y);}
      else{c2.lineTo(points[i].x,points[i].y);}
    }
    c2.stroke();
    c2.closePath();
  }
  function drawpoints(points,color){//draw points given color
    c2.fillStyle = color;
    for(var i=0;i<points.length;i++){
        if(points[i].type!='supertriangle'){
          c2.beginPath();
          c2.arc(points[i].x, points[i].y, 5, 0, 2 * Math.PI, true);
          c2.fill();
          c2.closePath();
      }
    }
  }
  function drawpoint(point,color){
    c2.fillStyle=color;
    c2.beginPath();
    c2.arc(point.x, point.y, 5, 0, 2 * Math.PI, true);
    c2.fill();
    c2.closePath();
  }
  function drawtri(color){//draw triangles given color
    drawcolor=color;
    for(var i=0;i<tri.length;i++){
        if (color=='random'){drawcolor='rgba('+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+',0.5)';}//'#'+Math.random().toString(16).slice(-6);}
        drawpoly([points[tri[i].p1],points[tri[i].p2],points[tri[i].p3]],drawcolor);
      //}
    }
  }
  function drawcc(color){//draw circumcenters of triangles with no supertriangle points
    var ccpoints=[];
    for(var i=0;i<tri.length;i++){
      if(points[tri[i].p1].type!='supertriangle' && points[tri[i].p2].type!='supertriangle' && points[tri[i].p3].type!='supertriangle'){
        ccpoints.push(tri[i].cc);
      }
    }
    drawpoints(ccpoints,color);
  }

  ////Boyer Watson Delunuay Triangulation and supporting functions
  function boyerwatson(newpt){
    var badtri=[];
    //for each triangle in triangulation do // first find all the triangles that are no longer valid due to the insertion
    //   if point is inside circumcircle of triangle
    //      add triangle to badTriangles
    for(var i=0;i<tri.length;i++){
      if (d2(newpt,tri[i].cc)<tri[i].cr){
        badtri.push(i);//storing triangle index
      }
    }
    //polygon := empty set
    var polyhole=[];
    //for each triangle in badTriangles do // find the boundary of the polygonal hole
    //   for each edge in triangle do
    //      if edge is not shared by any other triangles in badTriangles
    //         add edge to polygon
    for(var mybadtri=0;mybadtri<badtri.length;mybadtri++){
      var myedges = edges(tri[badtri[mybadtri]]);
      for(var myedgei=0;myedgei<myedges.length;myedgei++){
        var add=true;
        for(var yourbadtri=0;yourbadtri<badtri.length;yourbadtri++){
            if(mybadtri!=yourbadtri){
              var youredges=edges(tri[badtri[yourbadtri]]);
              for(var youredgei=0;youredgei<youredges.length;youredgei++){
                //console.log(myedges[myedgei].p1+','+myedges[myedgei].p2+' vs '+youredges[youredgei].p1+','+youredges[youredgei].p2);
                if(sameedge(myedges[myedgei],youredges[youredgei])){add=false;}
              }
            }
        }
        if(add){polyhole.push(myedges[myedgei]);}
      }
    }
    //for each triangle in badTriangles do // remove them from the data structure
    //   remove triangle from triangulation
    for(var badtrii=badtri.length-1;badtrii>=0;badtrii--){
      tri.splice(badtri[badtrii],1);
      }
    //for each edge in polygon do // re-triangulate the polygonal hole
    //   newTri := form a triangle from edge to point
    //   add newTri to triangulation
    newpt.player=player;
    var newptindex=points.push(newpt)-1;
    for(var holei=0;holei<polyhole.length;holei++){
      var newtriindex=tri.push({p1:newptindex,p2:polyhole[holei].p1,p3:polyhole[holei].p2})-1;
      var ccout=cc(tri[newtriindex]);
      tri[newtriindex].cc=ccout.cc;
      tri[newtriindex].cr=ccout.cr;
    }
  }
  function cc(triin){
    var d=2*(
      points[triin.p1].x*(points[triin.p2].y-points[triin.p3].y)+
      points[triin.p2].x*(points[triin.p3].y-points[triin.p1].y)+
      points[triin.p3].x*(points[triin.p1].y-points[triin.p2].y)
    );
    var ccx=((Math.pow(points[triin.p1].x,2)+Math.pow(points[triin.p1].y,2))*(points[triin.p2].y-points[triin.p3].y)+
             (Math.pow(points[triin.p2].x,2)+Math.pow(points[triin.p2].y,2))*(points[triin.p3].y-points[triin.p1].y)+
             (Math.pow(points[triin.p3].x,2)+Math.pow(points[triin.p3].y,2))*(points[triin.p1].y-points[triin.p2].y))/d;
    var ccy=((Math.pow(points[triin.p1].x,2)+Math.pow(points[triin.p1].y,2))*(points[triin.p3].x-points[triin.p2].x)+
             (Math.pow(points[triin.p2].x,2)+Math.pow(points[triin.p2].y,2))*(points[triin.p1].x-points[triin.p3].x)+
             (Math.pow(points[triin.p3].x,2)+Math.pow(points[triin.p3].y,2))*(points[triin.p2].x-points[triin.p1].x))/d;
    var cc={x:ccx,y:ccy};
    var a=d2(points[triin.p1],points[triin.p2]);
    var b=d2(points[triin.p2],points[triin.p3]);
    var c=d2(points[triin.p3],points[triin.p1]);
    var cr=a*b*c/Math.sqrt((a+b+c)*(b+c-a)*(c+a-b)*(a+b-c));
    return({cc:cc,cr:cr});
  }
  function sameedge(e1,e2){
    return((e1.p1==e2.p1 && e1.p2==e2.p2) || (e1.p1==e2.p2 && e1.p2==e2.p1));
  }
  function d2(p1,p2){
    return(Math.sqrt(Math.pow(p2.x-p1.x,2)+Math.pow(p2.y-p1.y,2)));
  }
  function edges(triin){
    var edges=[];
    edges.push({p1:triin.p1,p2:triin.p2});
    edges.push({p1:triin.p2,p2:triin.p3});
    edges.push({p1:triin.p3,p2:triin.p1});
    return edges;
  }
  function supercount(triin){
    return((points[triin.p1].type=='supertriangle')+(points[triin.p2].type=='supertriangle')+(points[triin.p3].type=='supertriangle'));
  }

  ////Delunuay > Voronoi and supporting functions
  function voronoi(){
    voropoly=[];
    for(var i=0;i<points.length;i++){//for each point
      //console.log('-----new point-----');
      if(points[i].type!='supertriangle'){//that isn't a supertriangle point
        var neighbortris=findneighbortris(i);//find neighboring tris (indices)
        var voropolyentry=[];
        for(var j=0;j<neighbortris.length;j++)  {//for each neighboring tri
          var sc=supercount(tri[neighbortris[j]]);
          if(sc===0){//if the neighboring tri doesn't contain a supertriangle point
          /*
            if(tri[neighbortris[j]].cc.x>600 || tri[neighbortris[j]].cc.x<0 || tri[neighbortris[j]].cc.y>600 || tri[neighbortris[j]].cc.y<0){
              console.log('cc outside, how bout that');
            }else{voropolyentry.push(tri[neighbortris[j]].cc);
              console.log('cc added: '+tri[neighbortris[j]].cc.x+','+tri[neighbortris[j]].cc.y);
            }//then add the circumcenter to the voronoi cell
            */
            voropolyentry.push(tri[neighbortris[j]].cc);
            //console.log('cc added: '+tri[neighbortris[j]].cc.x+','+tri[neighbortris[j]].cc.y);
          }
          else if(sc===1){//if neighbor tri does contain one supertriangle point
            //find the edge
            var legaledge=[];
            var superpoint=[];
            if(points[tri[neighbortris[j]].p1].type=='supertriangle'){superpoint.push(points[tri[neighbortris[j]].p1]);}else{legaledge.push(points[tri[neighbortris[j]].p1]);}
            if(points[tri[neighbortris[j]].p2].type=='supertriangle'){superpoint.push(points[tri[neighbortris[j]].p2]);}else{legaledge.push(points[tri[neighbortris[j]].p2]);}
            if(points[tri[neighbortris[j]].p3].type=='supertriangle'){superpoint.push(points[tri[neighbortris[j]].p3]);}else{legaledge.push(points[tri[neighbortris[j]].p3]);}
            superpoint=superpoint[0];
            var temppt;
            //find slope of legaledge
            if(legaledge[0].y-legaledge[1].y===0){//horizontal legaledge
              var horimidpt={x:(legaledge[0].x+legaledge[1].x)/2,y:(legaledge[0].y+legaledge[1].y)/2};
              var vertydir=(superpoint.y-horimidpt.y)>0?600:0;
              //console.log('sc1 (hori) added: '+horimidpt.x+','+vertydir);
              temppt={x:horimidpt.x,y:vertydir};
            }else if(legaledge[0].x-legaledge[1].x===0){//vertical legaledge
              var vertmidpt={x:(legaledge[0].x+legaledge[1].x)/2,y:(legaledge[0].y+legaledge[1].y)/2};
              var vertxdir=(superpoint.x-vertmidpt.x)>0?600:0;
              //console.log('sc1 (vert) added: '+vertxdir+','+vertmidpt.y);
              temppt={x:vertxdir,y:vertmidpt.y};
            }else{
              var tm=(legaledge[0].y-legaledge[1].y)/(legaledge[0].x-legaledge[1].x);//m=y2-y1/x2-x1;
              var tb=legaledge[0].y-tm*legaledge[0].x;//b=y-mx;
              var m=-1/tm;//find perpendicular slope
              var midpt={x:(legaledge[0].x+legaledge[1].x)/2,y:(legaledge[0].y+legaledge[1].y)/2};
              var b=midpt.y-m*midpt.x;//b=y-mx
              var xdir=(((superpoint.y-tb)/tm)-superpoint.x)<0?600:0;
              temppt={x:xdir,y:m*xdir+b};
              //console.log(temppt);
              if(temppt.y<0){
                temppt.y=0;
                temppt.x=(temppt.y-b)/m;
              }
              if(temppt.y>600){
                temppt.y=600;
                temppt.x=(temppt.y-b)/m;
              }

              //console.log('sc1 added: '+temppt.x+','+temppt.y);
            }
            //find the legal triangle attached to the legal edge
            //find the cc for that legal triangle
            //if temppt lies within the triangle formed by the legal edge and cc, then discard the temppt
            var legalcc;
            for(var o=0;o<neighbortris.length;o++)  {
              if(points[tri[neighbortris[o]].p1].type!='supertriangle' && points[tri[neighbortris[o]].p2].type!='supertriangle' && points[tri[neighbortris[o]].p3].type!='supertriangle'){//legal triangle
                if((points[tri[neighbortris[o]].p1]==legaledge[0] || points[tri[neighbortris[o]].p2]==legaledge[0] || points[tri[neighbortris[o]].p3]==legaledge[0]) &&
                   (points[tri[neighbortris[o]].p1]==legaledge[1] || points[tri[neighbortris[o]].p2]==legaledge[1] || points[tri[neighbortris[o]].p3]==legaledge[1])){
                     legalcc=tri[neighbortris[o]].cc;
                }
              }
            }
            //console.log(temppt+' in '+legaledge[0]+','+legaledge[1]+','+legalcc);
            //console.log('ptintriangle: '+ptInTriangle(temppt,legaledge[0],legaledge[1],legalcc));
            //console.log(legalcc);
            if((!legalcc) ||  !ptInTriangle(temppt,legaledge[0],legaledge[1],legalcc)){voropolyentry.push(temppt);}

          }
        }


        //begin fit to box
        //order the points
        voropolyentry=lorder(voropolyentry,i);
        //fit to box
        var realvoropolyentry=voropolyentry.slice(0);
        for(var r=0;r<voropolyentry.length;r++){
          //if out of bounds
          if(voropolyentry[r].x<0 || voropolyentry[r].x>600 || voropolyentry[r].y<0 || voropolyentry[r].y>600){
            //find the r-1 and r+1 points
            var before,after;
            if(r===0){before=(voropolyentry.length-1);}else{before=r-1;}
            if(r===(voropolyentry.length-1)){after=0;}else{after=r+1;}
            //see when it intersects (except when x or y is 0 or 600)
            var tempm1,tempb1,y1,y2,x1,x2;
            tempm1=(voropolyentry[before].y-voropolyentry[r].y)/(voropolyentry[before].x-voropolyentry[r].x);
            tempb1=voropolyentry[r].y-tempm1*voropolyentry[r].x;
            var tempm2,tempb2;
            tempm2=(voropolyentry[after].y-voropolyentry[r].y)/(voropolyentry[after].x-voropolyentry[r].x);
            tempb2=voropolyentry[r].y-tempm2*voropolyentry[r].x;
            if(voropolyentry[r].x<0){
              y1=tempm1*0+tempb1;if(y1>0 && y1<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[before].x>0){realvoropolyentry=safepush({x:0,y:y1},realvoropolyentry);}}
              y2=tempm2*0+tempb2;if(y2>0 && y2<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[after].x>0){realvoropolyentry=safepush({x:0,y:y2},realvoropolyentry);}}
            }if(voropolyentry[r].x>600){
              y1=tempm1*600+tempb1;if(y1>0 && y1<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[before].x<600){realvoropolyentry=safepush({x:600,y:y1},realvoropolyentry);}}
              y2=tempm2*600+tempb2;if(y2>0 && y2<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[after].x<600){realvoropolyentry=safepush({x:600,y:y2},realvoropolyentry);}}
            }if(voropolyentry[r].y<0){
              if((voropolyentry[before].x-voropolyentry[r].x)===0){x1=voropolyentry[r].x;}//vertical line
              else{x1=(0-tempb1)/tempm1;}if(x1>0 && x1<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[before].y>0){realvoropolyentry=safepush({x:x1,y:0},realvoropolyentry);}}
              if((voropolyentry[after].x-voropolyentry[r].x)===0){x2=voropolyentry[r].x;}
              else{x2=(0-tempb2)/tempm2;}if(x2>0 && x2<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[after].y>0){realvoropolyentry=safepush({x:x2,y:0},realvoropolyentry);}}
            }if(voropolyentry[r].y>600){
              if((voropolyentry[before].x-voropolyentry[r].x)===0){x1=voropolyentry[r].x;}
              else{x1=(600-tempb1)/tempm1;}if(x1>0 && x1<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[before].y<600){realvoropolyentry=safepush({x:x1,y:600},realvoropolyentry);}}
              if((voropolyentry[after].x-voropolyentry[r].x)===0){x2=voropolyentry[r].x;}
              else{x2=(600-tempb2)/tempm2;}if(x2>0 && x2<600){removefromlist(voropolyentry[r],realvoropolyentry);if(voropolyentry[after].y<600){realvoropolyentry=safepush({x:x2,y:600},realvoropolyentry);}}
            }
          }
        }
        //re-order the points

        realvoropolyentry=lorder(realvoropolyentry,i);
        voropolyentry=realvoropolyentry.slice(0);
        //end fit to box



        //console.log(voropoly);
        //determine border situation

        var border={top:false,bottom:false,left:false,right:false};
        for(var q=0;q<voropolyentry.length;q++){
          if(voropolyentry[q].x<=0){border.left=voropolyentry[q];}//if(border.left){border.left=false;}else{border.left=voropolyentry[q];}}
          else if(voropolyentry[q].x>=600){border.right=voropolyentry[q];}//if(border.right){border.right=false;}else{border.right=voropolyentry[q];}}
          else if(voropolyentry[q].y<=0){border.top=voropolyentry[q];}//if(border.top){border.top=false;}else{border.top=voropolyentry[q];}}
          else if(voropolyentry[q].y>=600){border.bottom=voropolyentry[q];}//if(border.bottom){border.bottom=false;}else{border.bottom=voropolyentry[q];}}
        }

        var tempm,tempb,tempp1,tempp2,safesides;
        var tl={x:0,y:0};
        var tr={x:600,y:0};
        var bl={x:0,y:600};
        var br={x:600,y:600};
        if(border.top && border.left){
          tempp1=border.top;tempp2=border.left;tempm=(tempp1.y-tempp2.y)/(tempp1.x-tempp2.x);tempb=tempp1.y-tempm*tempp1.x;safesides=safeside(points[i],tempm,tempb);
          if(safesides.top && safesides.left){voropolyentry.push(tl);}else if(safesides.right && safesides.bottom){voropolyentry.push(tr);voropolyentry.push(bl);voropolyentry.push(br);}
        }
        if(border.top && border.right){
          tempp1=border.top;tempp2=border.right;tempm=(tempp1.y-tempp2.y)/(tempp1.x-tempp2.x);tempb=tempp1.y-tempm*tempp1.x;safesides=safeside(points[i],tempm,tempb);
          if(safesides.top && safesides.right){voropolyentry.push(tr);}else if(safesides.bottom && safesides.left){voropolyentry.push(bl);voropolyentry.push(br);voropolyentry.push(tl);}
        }
        if(border.bottom && border.left){
          tempp1=border.bottom;tempp2=border.left;tempm=(tempp1.y-tempp2.y)/(tempp1.x-tempp2.x);tempb=tempp1.y-tempm*tempp1.x;safesides=safeside(points[i],tempm,tempb);
          if(safesides.bottom && safesides.left){voropolyentry.push(bl);}else if(safesides.top && safesides.right){voropolyentry.push(br);voropolyentry.push(tl);voropolyentry.push(tr);}
        }
        if(border.bottom && border.right){
          tempp1=border.bottom;tempp2=border.right;tempm=(tempp1.y-tempp2.y)/(tempp1.x-tempp2.x);tempb=tempp1.y-tempm*tempp1.x;safesides=safeside(points[i],tempm,tempb);
          if(safesides.bottom && safesides.right){voropolyentry.push(br);}else if(safesides.top && safesides.left){voropolyentry.push(tl);voropolyentry.push(tr);voropolyentry.push(bl);}
        }
        if(border.right && border.left){
          tempp1=border.right;tempp2=border.left;tempm=(tempp1.y-tempp2.y)/(tempp1.x-tempp2.x);tempb=tempp1.y-tempm*tempp1.x;safesides=safeside(points[i],tempm,tempb);
          if(safesides.top){voropolyentry.push(tl);voropolyentry.push(tr);}else if(safesides.bottom){voropolyentry.push(bl);voropolyentry.push(br);}
        }
        if(border.top && border.bottom){
          tempp1=border.top;tempp2=border.bottom;
          if((tempp1.x-tempp2.x)===0){
              safesides=safesideline(points[i],tempp1.x);
              if(safesides.right){voropolyentry.push(tr);voropolyentry.push(br);}
              else if(safesides.left){voropolyentry.push(tl);voropolyentry.push(bl);}
          }
          else{
            tempm=(tempp1.y-tempp2.y)/(tempp1.x-tempp2.x);tempb=tempp1.y-tempm*tempp1.x;safesides=safeside(points[i],tempm,tempb);
            if(safesides.left){voropolyentry.push(tl);voropolyentry.push(bl);}else if(safesides.right){voropolyentry.push(tr);voropolyentry.push(br);}
          }
        }

        //end border situation

        voropolyentry=lorder(voropolyentry,i);


        //console.log(voropolyentry);
        voropoly.push({voropolyentry:voropolyentry,player:points[i].player});
        //console.log('-------------');
      }
    }
  }
  function lorder(list,i){
    for(var u=0;u<list.length;u++){
      list[u].angle=tanangle(points[i],list[u]);
    }
    list.sort(function(a, b){
      return((a.angle >= b.angle) ? 1 : -1);
    });
    return list;
  }
  function safepush(value,list){
    var index=-1;
    for (var i=0;i<list.length;i++){
      if(list[i].x==value.x && list[i].y==value.y){index=i;}
    }
    if (index == -1) {
      list.push(value);
    }
    return list;
  }
  function removefromlist(value,list){
    var index=-1;
    for (var i=0;i<list.length;i++){
      if(list[i].x==value.x && list[i].y==value.y){index=i;}
    }
    if (index > -1) {
      list.splice(index, 1);
    }
    return list;
  }
  function safesideline(mypt,xlim){
    var retval={left:true,top:true,right:true,bottom:true};
    for(var i=0;i<points.length;i++){
      if(points[i]!=mypt && points[i].type!='supertriangle'){
        if(points[i].x>xlim){retval.right=false;}
        else{retval.left=false;}
      }
    }
    return retval;
  }
  function safeside(mypt,min,bin){
    var retval={left:true,top:true,right:true,bottom:true};
    for(var i=0;i<points.length;i++){
      if(points[i]!=mypt && points[i].type!='supertriangle'){
        //y=mx+b
        if(points[i].y>(min*points[i].x+bin)){retval.bottom=false;}else{retval.top=false;}
        //x=(y-b)/m
        if(points[i].x>((points[i].y-bin)/min)){retval.right=false;}else{retval.left=false;}
      }
    }
    return retval;
  }
  function ptInTriangle(p, p0, p1, p2) {//http://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
    var A = 1/2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    var sign = A < 0 ? -1 : 1;
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
  }
  function drawvoronoi(){
    for(var i=0;i<voropoly.length;i++){
      //drawcolor='rgba('+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+',0.5)';

      if(voropoly[i].player===1){
        drawcolor='rgba(255,0,0,0.2)';
      }else if(voropoly[i].player===2){
        drawcolor='rgba(0,0,255,0.2)';
      }
      drawpoly(voropoly[i].voropolyentry,drawcolor);
    }
  }
  function drawvoronoilines(){
    for(var i=0;i<voropoly.length;i++){
      //drawcolor='rgba('+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+',1)';
      drawcolor='rgba(1,1,1,1)';
      var tempvoropoly=voropoly[i].voropolyentry;
      //tempvoropoly.push(voropoly[i][0]);
      drawline(tempvoropoly,drawcolor);
    }
  }
  function tanangle(ctr,newpt){
    return(Math.atan2(newpt.y-ctr.y,newpt.x-ctr.x));
  }
  function findneighbortris(ptindex){
    rettrilist=[];
    for(var i=0;i<tri.length;i++){
      if(tri[i].p1==ptindex || tri[i].p2==ptindex || tri[i].p3==ptindex){
        rettrilist.push(i);
      }
    }
    return(rettrilist);//returning indices in the triangle array
  }

  //Event Handling and supporting functions
  canvas.addEventListener('click',function(evt){
    var x = evt.offsetX || (evt.pageX - canvas.offsetLeft);
    var y = evt.offsetY || (evt.pageY - canvas.offsetTop);
    //console.log('clicked: ('+x+','+y+')');
    //make sure we're not clicking on the same point twice
    var repeat=false;
    for(var i=0;i<points.length;i++){if(points[i].x==x && points[i].y==y){repeat=true;}}
    if(!repeat){
      boyerwatson({x:x,y:y});//calculate delunuay
      voronoi();//calculate voronoi
      score();
      //consolevoro();
      if(player==1){player=2;}else{player=1;turn++;}
      redraw();
    }
  },false);

  function redraw(){
    c2.clearRect(0, 0, canvas.width, canvas.height);
    //drawtri('random'); //http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
    drawvoronoi();
    drawvoronoilines();
    drawsidedpoints();
    //drawcc('#ff0000');
  }

  function score(){
    var score1=0,score2=0,voropolyarea;
    for(var i=0;i<voropoly.length;i++){
      //calculate area
      voropolyarea=shoelace(voropoly[i].voropolyentry);
      if(voropoly[i].player==1){score1+=voropolyarea;}
      else if(voropoly[i].player==2){score2+=voropolyarea;}
    }
    document.getElementById("title").innerHTML="VORONIO<br><player1>"+Math.round((score1/(3600) + 0.00001) * 100) / 100+"%</player1> : <player2>"+Math.round((score2/(3600) + 0.00001) * 100) / 100+"%</player2>";
    console.log('turn: '+turn+' ,player: '+player);
    console.log('player 1: '+Math.round((score1/(3600) + 0.00001) * 100) / 100+'%');
    console.log('player 2: '+Math.round((score2/(3600) + 0.00001) * 100) / 100+'%');
    console.log('total: '+(score1+score2));
  }

  function shoelace(list){
    var otheri,sum=0;
    for(var i=0;i<list.length;i++){
      otheri=((i==list.length-1)?0:i+1);
      sum+=((list[i].x*list[otheri].y)-(list[i].y*list[otheri].x));
    }
    return sum/2;
  }
  function drawsidedpoints(){
    var color;
    for(var i=0;i<points.length;i++){
      if(points.type!='supertriangle'){
        if (points[i].player==1){color='rgba(255,0,0,1)';}
        else if (points[i].player==2){color='rgba(0,0,255,1)';}
        drawpoint(points[i],color);
      }
    }
  }

  function consolevoro(){
    console.log('======================');
    for(var i=0;i<voropoly.length;i++){
      for(var j=0;j<voropoly[i].voropolyentry.length;j++){
        if(voropoly[i].voropolyentry[j].x>600 || voropoly[i].voropolyentry[j].x<0 || voropoly[i].voropolyentry[j].y>600 || voropoly[i].voropolyentry[j].y<0){console.log('('+voropoly[i].voropolyentry[j].x+','+voropoly[i].voropolyentry[j].y+')');}
      }
      console.log('--------');
    }
  }

























});
