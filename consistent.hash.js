(function(ConsistentHash) {

	var _crc32=function(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};
	var _diff=function(a,b) {return b.filter(function(i) {return a.indexOf(i) < 0;})}
	
	//port of https://github.com/pda/flexihash/blob/master/src/Flexihash.php 
	
	ConsistentHash.create=function() {
		var ch={};
		ch.hash=_crc32;
		ch.node2pos={};
		ch.pos2node={};
		ch.nodeCount=0;
		ch.sorted=[];
	
		ch.numPositions=64;
	
		/**
		 * add nodes.
		 * @param {string|string[]} nodeid
		 */
		ch.add=function(nodeid) {
			if (!nodeid) return;
			if (Array.isArray(nodeid)) {
				nodeid.forEach(ch.add);
				return;
			}
			if (ch.node2pos[nodeid]) return;
			var pos=[];
			for(var i=0;i<ch.numPositions;i++) {
				var cpos=ch.hash(nodeid+'@'+i);
				if (ch.pos2node[cpos]) continue;
				pos.push(cpos);
				ch.pos2node[cpos]=nodeid;
			}
			ch.node2pos[nodeid]=pos;
	
			ch.nodeCount=Object.keys(ch.node2pos).length;
			ch.sorted=Object.keys(ch.pos2node).sort(function(a,b) {return a-b;});
		}
	
		/**
		 * remove nodes.
		 * @param {string|string[]} nodeid
		 */
		 ch.del=function(nodeid) {
			if (!nodeid) return;
			if (Array.isArray(nodeid)) {
				nodeid.forEach(ch.del);
				return;
			}
			var pos=ch.node2pos[nodeid];
			if (!pos) return; // not exists
			for (var i=0,l=pos.length;i<l;i++) {
				delete ch.pos2node[pos[i]];
			}
			delete ch.node2pos[nodeid];
	
			ch.nodeCount=Object.keys(ch.node2pos).length;
			ch.sorted=Object.keys(ch.pos2node).sort(function(a,b) {return a-b;});
		}
	
		/**
		 * set nodes.
		 * @param {string|string[]} nodeid
		 */
		 ch.set=function(nodeids) {
			if (!nodeids) return;
			if (!Array.isArray(nodeids)) nodeids=[nodeids];
			var cnodes=Object.keys(ch.node2pos);
			ch.add(_diff(cnodes, nodeids));
			ch.del(_diff(nodeids, cnodes));
		}
		
		/**
		 * get nodes for key
		 * @param {string} key
		 * @param {int} [count=1]
		 * @returns {string[]}
		 */
		 ch.get=function(key, count) {
			count=count||1;
			if (count>ch.nodeCount) count=ch.nodeCount;
			if (!count) return[];
	
			var spos=ch.hash(key);
			var low=0;
			var high=ch.sorted.length-1;
	
			var nodes=[];
	
			while(1) {
				var notfound=(low>high)?true:false;
				var probe=Math.floor((high+low)/2);
				if (notfound===false && ch.sorted[probe]<=spos) {
					low=probe+1;
				} else if (probe===0 || spos > ch.sorted[probe-1] || notfound===true) {
					if (notfound) {
						probe=0;
					}
					var node=ch.pos2node[ch.sorted[probe]];
					nodes.push(node);
	
					while (nodes.length<count) {
						if (++probe>=ch.sorted.length) probe=0;
						var cnode=ch.pos2node[ch.sorted[probe]];
						if (nodes.indexOf(cnode)<0) nodes.push(cnode);
					}
	
					break;
				} else {
					high=probe-1;
				}
			}
			return nodes;
		}
	
		return ch;
	}
	
	})(
		(typeof exports === 'object' && typeof module !== 'undefined')?
		module.exports:window.ConsistentHash={}
	)