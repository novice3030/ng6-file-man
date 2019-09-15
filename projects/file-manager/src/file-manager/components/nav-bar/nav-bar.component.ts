import { Component, OnInit } from "@angular/core";
import { select, Store } from "@ngrx/store";
import * as ACTIONS from "../../reducers/actions.action";
import { AppStore } from "../../reducers/reducer.factory";
import { NodeService } from "../../services/node.service";
import { fileManagerSelectedPath } from "../../reducers/stateReducer";

@Component({
  selector: "app-nav-bar",
  templateUrl: "./nav-bar.component.html",
  styleUrls: ["./nav-bar.component.scss"]
})
export class NavBarComponent implements OnInit {
  currentPath: string[];

  constructor(
    private store: Store<AppStore>,
    private nodeService: NodeService
  ) {}

  ngOnInit() {
    this.store
      .pipe(select(fileManagerSelectedPath))
      .subscribe((data: string) => {
        this.nodeService.currentPath = data;
        this.currentPath = data.split("/");
      });
  }

  onClick(path: string[], index: number) {
    const newPath = path.slice(0, index + 1).join("/");
    this.store.dispatch(new ACTIONS.SetPath(newPath));
  }
}
