import {Injectable} from '@angular/core';
import {NodeInterface} from '../interfaces/node.interface';
import {Observable} from 'rxjs';
import {TreeModel} from '../models/tree.model';
import {HttpClient, HttpParams} from '@angular/common/http';
import * as ACTIONS from '../reducers/actions.action';
import {Store} from '@ngrx/store';
import {AppStore} from '../reducers/reducer.factory';

@Injectable({
  providedIn: 'root'
})
export class NodeService {
  public tree: TreeModel;
  private _path: string;

  constructor(private http: HttpClient, private store: Store<AppStore>) {
  }

  // todo server mi da aj strukturu rodicov a tu nasadim
  public startManagerAt(path: string) {
    this.store.dispatch({type: ACTIONS.SET_PATH, payload: path});
  }

  getNodes(path: string) {
    this.parseNodes(path).subscribe((data: Array<NodeInterface>) => {
      for (let i = 0; i < data.length; i++) {
        const parentPath = this.getParentPath(data[i].pathToNode);
        this.findParent(parentPath).children[data[i].name] = data[i];
      }
    });
  }

  private getParentPath(path: string): string {
    let parentPath = path.split('/');
    parentPath = parentPath.slice(0, parentPath.length - 1);
    return parentPath.join('/');
  }

  private parseNodes(path: string): Observable<NodeInterface[]> {
    return new Observable(observer => {
      this.getNodesFromServer(path).subscribe((data: Array<any>) => {
        observer.next(data.map(node => this.createNode(path, node)));
        this.store.dispatch({type: ACTIONS.SET_LOADING_STATE, payload: false});
      });
    });
  }

  private createNode(path, node): NodeInterface {
    if (node.path[0] !== '/') {
      console.warn('[Node Service] Server should return initial path with "/"');
      node.path = '/' + node.path;
    }

    const cachedNode = this.findParent(node.path);

    return <NodeInterface>{
      id: node.id,
      isFolder: node.dir,
      isExpanded: cachedNode ? cachedNode.isExpanded : false,
      pathToNode: node.path,
      pathToParent: this.getParentPath(node.path),
      name: node.name || node.id,
      children: cachedNode ? cachedNode.children : {}
    };
  }

  private getNodesFromServer = (path: string) =>
    this.http.get(this.tree.config.baseURL + this.tree.config.api.listFile, {params: new HttpParams().set('path', path)});

  public findParent(parentPath: string): NodeInterface {
    const ids = parentPath.split('/');
    ids.splice(0, 1);

    return ids.length === 0 ? this.tree.nodes : ids.reduce((value, index) => value['children'][index], this.tree.nodes);
  }

  public foldRecursively(node: NodeInterface) {
    // console.log('folding ', node);
    const children = node.children;

    Object.keys(children).map((child: string) => {
      if (!children.hasOwnProperty(child) || !children[child].isExpanded) {
        return null;
      }

      this.foldRecursively(children[child]);
      //todo put this getElById into one func (curr inside node.component.ts + fm.component.ts) - this won't be maintainable
      document.getElementById(children[child].pathToNode).classList.add('deselected');
      children[child].isExpanded = false;
    });
  }

  public foldAll() {
    this.foldRecursively(this.tree.nodes);
  }

  get currentPath(): string {
    return this._path;
  }

  set currentPath(value: string) {
    this._path = value;
  }
}
