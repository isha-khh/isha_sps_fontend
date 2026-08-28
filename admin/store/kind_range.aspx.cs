using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Collections;
using ez.data;

public partial class admin_kind_range : ez.admin.PageBase
{
    store.kind pro_kind = new store.kind();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
                if (!isStrNull(Request["nation"])) { nation.SelectedValue = ValString(Request["nation"]); }
            }

            BuildTreeView();

            int root = 0;
            if (!isStrNull(Request["num"]))
            {
                root = Val(Request["num"]);
            }

        
            Repeater1.DataSource = pro_kind.RowDataTable(root, nation.SelectedValue);
            Repeater1.DataBind();
        }
       
    }
    
    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect( Request.Url.AbsolutePath +  "?nation=" + nation.SelectedValue);
    }

    #region 產生TreeView選單

    public void BuildTreeView()
    {
        this.TreeView1.Nodes.Clear();
        BuildChild(0, this.TreeView1.Nodes, 1);
    }

    public void BuildChild(int RootUid, TreeNodeCollection Nodes, int level)
    {
        
        bool isLastLevel = (level + 1 > pro_kind.LevelMax);

        ArrayList Rows = pro_kind.RowData(RootUid, nation.SelectedValue);

        foreach (store.kind.DataInfo info in Rows)
        {

            TreeNode newNode = new TreeNode();


            if (Val(Request["num"]) == info.num)
            {
                newNode.Text = "<b><span style=\"color:blue\">" + info.kind + "</span></b>";
            }
            else
            {
                newNode.Text = info.kind;
            }
            newNode.Value = info.num.ToString();
            newNode.NavigateUrl = Request.Url.AbsolutePath +  "?num=" + info.num.ToString() + "&nation=" + nation.SelectedValue;
            newNode.Expand();
            Nodes.Add(newNode);
            if (!isLastLevel)
            {
                BuildChild(info.num, newNode.ChildNodes, level + 1);
            }

        }


    }

    #endregion

    #region 儲存

    protected void submitButton_Click(object sender, EventArgs e)
    {
        store.kind pro_kind = new store.kind();
        msg.Text = "";
        if (!isStrNull(sortNum.Value) && IsNumeric(sortNum.Value.Split(',')[0]))
        {
            if (pro_kind.SaveSort(sortNum.Value.Split(',').Select(x => int.Parse(x)).ToArray()))
            {
                ScriptMsg("儲存排序成功", Request.Url.AbsoluteUri);
            }
            else
            {
                ScriptMsg("儲存排序失敗");
                msg.Text = pro_kind.log;
            }
        }
        else
        {
            ScriptMsg("無排序資料");
        }
    }

    #endregion

  

    
}